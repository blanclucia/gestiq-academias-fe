import { ApiError, apiBaseUrl, createHttpClient } from '@/services/http/client'
import { loginResponseSchema, sessionSchema, tokenPairSchema, type LoginInput, type TokenPair } from './contracts'

type AuthState = { phase: 'bootstrapping' | 'anonymous' | 'signed-in' | 'password-change'; generation: number; organizationSlug?: string; challengeExpiresAt?: number }
type Request = ReturnType<typeof createHttpClient>

// The access token lives only in this instance, never in browser storage or query keys. The
// refresh token never reaches this instance at all — the server sets it as an httpOnly cookie
// (see cmd/api/handlers/auth.go), so it survives a reload without ever being readable by
// JavaScript. login/refresh/logout send that cookie via `credentials: 'include'`; every other
// request stays `credentials: 'omit'` (the default) since it only needs the in-memory access token.
export class AuthClient {
    private tokens: TokenPair | null = null
    private accessExpiresAt = 0
    private challenge: string | null = null
    private state: AuthState = { phase: 'bootstrapping', generation: 0 }
    private listeners = new Set<() => void>()
    private refreshing: Promise<void> | null = null

    private readonly request: Request
    constructor(request: Request = createHttpClient(apiBaseUrl)) { this.request = request }
    getSnapshot = () => this.state
    subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }

    private publish(state: AuthState) {
        this.state = state
        this.listeners.forEach((listener) => listener())
    }
    clear = () => {
        this.tokens = null
        this.challenge = null
        this.refreshing = null
        this.publish({ phase: 'anonymous', generation: this.state.generation + 1 })
    }
    private storeTokens(pair: TokenPair) {
        this.tokens = pair
        this.accessExpiresAt = Date.now() + pair.expiresIn * 1000
    }
    private checkGeneration(generation: number) {
        if (generation !== this.state.generation) throw new DOMException('Operación cancelada', 'AbortError')
    }
    // Called once, on app start. Attempts a silent refresh against whatever the browser already
    // has in its cookie jar — succeeds into 'signed-in' without a login form if the refresh
    // cookie from an earlier session is still valid, otherwise falls back to 'anonymous'.
    async bootstrap() {
        if (this.state.phase !== 'bootstrapping') return
        const generation = this.state.generation
        try {
            await this.refresh()
            if (generation === this.state.generation && this.state.phase === 'bootstrapping') {
                this.publish({ ...this.state, phase: 'signed-in' })
            }
        } catch {
            // refresh() already moved to 'anonymous' via clear() on failure — nothing left to do.
        }
    }
    async login(input: LoginInput) {
        this.clear()
        const generation = this.state.generation
        const result = loginResponseSchema.parse(await this.request('/auth/login', { method: 'POST', credentials: 'include', body: JSON.stringify(input) }))
        if (generation !== this.state.generation) {
            if (!result.mustChangePassword) await this.revoke().catch(() => undefined)
            this.checkGeneration(generation)
        }
        if (result.mustChangePassword) {
            this.challenge = result.changePasswordToken
            this.publish({ phase: 'password-change', generation, challengeExpiresAt: Date.now() + result.expiresIn * 1000 })
        } else {
            this.storeTokens(result)
            this.publish({ phase: 'signed-in', generation })
        }
    }
    async changeInitialPassword(newPassword: string) {
        if (!this.challenge || Date.now() >= (this.state.challengeExpiresAt ?? 0)) { this.clear(); throw new ApiError(401, 'unauthenticated') }
        const generation = this.state.generation
        try {
            await this.request('/auth/change-password', { method: 'POST', headers: { Authorization: `Bearer ${this.challenge}` }, body: JSON.stringify({ newPassword }) })
            this.checkGeneration(generation)
            this.clear()
        } catch (error) {
            if (generation === this.state.generation && error instanceof ApiError && [401, 403].includes(error.status)) this.clear()
            throw error
        }
    }
    private revoke() {
        return this.request('/auth/logout', { method: 'POST', credentials: 'include' })
    }
    async logout() {
        this.clear()
        // Best-effort: the server's logout is idempotent even without a live cookie, so this is
        // safe to call unconditionally rather than depending on in-memory state we no longer keep.
        await this.revoke()
    }
    private refresh(): Promise<void> {
        if (this.refreshing) return this.refreshing
        const generation = this.state.generation
        const operation = (async () => {
            try {
                const pair = tokenPairSchema.parse(await this.request('/auth/refresh', { method: 'POST', credentials: 'include' }))
                this.checkGeneration(generation)
                this.storeTokens(pair)
            } catch (error) {
                // A lost response may have consumed the refresh: never retry that token.
                if (generation === this.state.generation) this.clear()
                throw error
            }
        })()
        this.refreshing = operation
        void operation.finally(() => { if (this.refreshing === operation) this.refreshing = null }).catch(() => undefined)
        return operation
    }
    async authorizedRequest(path: string, init: RequestInit = {}): Promise<unknown> {
        const generation = this.state.generation
        if (!this.tokens) throw new ApiError(401, 'unauthenticated')
        if (Date.now() >= this.accessExpiresAt - 10000) await this.refresh()
        this.checkGeneration(generation)
        const access = this.tokens!.accessToken
        const send = (token: string) => {
            const headers = new Headers(init.headers)
            headers.set('Authorization', `Bearer ${token}`)
            return this.request(path, { ...init, headers })
        }
        try {
            const result = await send(access)
            this.checkGeneration(generation)
            return result
        } catch (error) {
            this.checkGeneration(generation)
            if (!(error instanceof ApiError) || error.status !== 401) throw error
            // A parallel request may already have rotated the rejected access token.
            if (this.tokens?.accessToken === access) await this.refresh()
            this.checkGeneration(generation)
            try {
                const result = await send(this.tokens!.accessToken)
                this.checkGeneration(generation)
                return result
            } catch (retryError) {
                if (generation === this.state.generation && retryError instanceof ApiError && retryError.status === 401) this.clear()
                throw retryError
            }
        }
    }
    async session(signal?: AbortSignal) {
        const generation = this.state.generation
        try {
            const session = sessionSchema.parse(await this.authorizedRequest('/session/context', { signal }))
            // Login never picks an organization upfront — the first successful read here is what
            // pins this session to one. A later read resolving to a different org (membership
            // changed underneath an idle tab) is treated as forbidden rather than silently switched.
            if (this.state.organizationSlug && session.organization.slug !== this.state.organizationSlug) throw new ApiError(403, 'forbidden')
            if (generation === this.state.generation && this.state.organizationSlug !== session.organization.slug) {
                this.publish({ ...this.state, organizationSlug: session.organization.slug })
            }
            return session
        } catch (error) {
            if (generation === this.state.generation && error instanceof ApiError && error.status === 403) this.clear()
            throw error
        }
    }
}
export const authClient = new AuthClient()
