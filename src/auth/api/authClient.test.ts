import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/services/http/client'
import { AuthClient } from './authClient'

const pair = { mustChangePassword: false, accessToken: `a_${'a'.repeat(43)}`, refreshToken: `r_${'b'.repeat(43)}`, tokenType: 'Bearer', expiresIn: 900, refreshExpiresIn: 6000 }
const rotated = { ...pair, accessToken: `a_${'c'.repeat(43)}`, refreshToken: `r_${'d'.repeat(43)}` }
const login = { dni: '90000001', password: 'private-test-password', organizationSlug: 'academy-demo' }
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>((done) => { resolve = done }); return { promise, resolve } }

describe('in-memory authentication', () => {
    it('keeps first access restricted and uses its token only to change the password', async () => {
        const request = vi.fn().mockResolvedValueOnce({ mustChangePassword: true, changePasswordToken: `p_${'p'.repeat(43)}`, expiresIn: 600 }).mockResolvedValueOnce(undefined)
        const client = new AuthClient(request)
        await client.login(login)
        expect(client.getSnapshot().phase).toBe('password-change')
        await expect(client.authorizedRequest('/session/context')).rejects.toMatchObject({ status: 401 })
        expect(request).toHaveBeenCalledTimes(1)
        await client.changeInitialPassword('a-new-test-password')
        expect(request.mock.calls[1][1].headers.Authorization).toMatch(/^Bearer p_/)
        expect(client.getSnapshot().phase).toBe('anonymous')
        expect(JSON.stringify(client.getSnapshot())).not.toContain('Token')
    })
    it('shares one refresh across concurrent 401 responses', async () => {
        const refreshing = deferred<unknown>()
        const request = vi.fn(async (path: string, init?: RequestInit) => {
            if (path === '/auth/login') return pair
            if (path === '/auth/refresh') return refreshing.promise
            if (new Headers(init?.headers).get('Authorization') === `Bearer ${pair.accessToken}`) throw new ApiError(401, 'unauthenticated')
            return { ok: true }
        })
        const client = new AuthClient(request)
        await client.login(login)
        const first = client.authorizedRequest('/resource')
        const second = client.authorizedRequest('/resource')
        await vi.waitFor(() => expect(request.mock.calls.filter(([path]) => path === '/auth/refresh')).toHaveLength(1))
        refreshing.resolve(rotated)
        await expect(Promise.all([first, second])).resolves.toEqual([{ ok: true }, { ok: true }])
        expect(request.mock.calls.filter(([path]) => path === '/auth/refresh')).toHaveLength(1)
    })
    it('does not reuse a refresh after losing its response', async () => {
        const request = vi.fn().mockResolvedValueOnce(pair).mockRejectedValueOnce(new ApiError(401, 'unauthenticated')).mockRejectedValueOnce(new TypeError('Network error'))
        const client = new AuthClient(request)
        await client.login(login)
        await expect(client.authorizedRequest('/resource')).rejects.toThrow('Network error')
        expect(client.getSnapshot().phase).toBe('anonymous')
        await expect(client.authorizedRequest('/resource')).rejects.toMatchObject({ status: 401 })
        expect(request).toHaveBeenCalledTimes(3)
    })
    it('cannot resurrect a session when refresh completes after logout', async () => {
        const refresh = deferred<unknown>()
        const request = vi.fn(async (path: string) => {
            if (path === '/auth/login') return pair
            if (path === '/auth/refresh') return refresh.promise
            if (path === '/auth/logout') return undefined
            throw new ApiError(401, 'unauthenticated')
        })
        const client = new AuthClient(request)
        await client.login(login)
        const operation = client.authorizedRequest('/resource')
        const outcome = expect(operation).rejects.toMatchObject({ name: 'AbortError' })
        await vi.waitFor(() => expect(request.mock.calls.some(([path]) => path === '/auth/refresh')).toBe(true))
        await client.logout()
        refresh.resolve(rotated)
        await outcome
        expect(client.getSnapshot().phase).toBe('anonymous')
    })
    it('does not renew on a permission denial', async () => {
        const request = vi.fn().mockResolvedValueOnce(pair).mockRejectedValueOnce(new ApiError(403, 'forbidden'))
        const client = new AuthClient(request)
        await client.login(login)
        await expect(client.authorizedRequest('/resource')).rejects.toMatchObject({ status: 403 })
        expect(request).toHaveBeenCalledTimes(2)
        expect(client.getSnapshot().phase).toBe('signed-in')
    })
    it('revokes a late login result after cancellation', async () => {
        const response = deferred<unknown>()
        const request = vi.fn().mockReturnValueOnce(response.promise).mockResolvedValueOnce(undefined)
        const client = new AuthClient(request)
        const operation = client.login(login)
        const outcome = expect(operation).rejects.toMatchObject({ name: 'AbortError' })
        client.clear()
        response.resolve(pair)
        await outcome
        expect(request.mock.calls[1][0]).toBe('/auth/logout')
        expect(client.getSnapshot().phase).toBe('anonymous')
    })
})
