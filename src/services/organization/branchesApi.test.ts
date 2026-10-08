import { describe, expect, it, vi } from 'vitest'
import { assignBranchAdministratorApi, assignBranchStaffApi, createBranchApi, fetchBranches, revokeBranchAdministratorApi, revokeBranchStaffApi, updateBranchApi } from './branchesApi'

const apiBranch = {
    id: 'b1', name: 'Sede Centro', email: 'centro@example.com', phone: '+54 351 000-0000', address: 'Calle Falsa 123',
    timezone: 'America/Argentina/Cordoba', openingTime: '08:00', closingTime: '21:00', operatingWeekdays: [1, 2, 3, 4, 5], status: 'active' as const,
}

describe('branches API client', () => {
    it('lists branches for an organization', async () => {
        const request = vi.fn().mockResolvedValue({ items: [apiBranch] })
        const branches = await fetchBranches('academy-demo', undefined, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/branches', expect.objectContaining({ signal: undefined }))
        expect(branches).toEqual([apiBranch])
    })
    it('creates a branch with the given payload', async () => {
        const request = vi.fn().mockResolvedValue(apiBranch)
        const input = { displayCode: 'CENTRO_1', name: 'Sede Centro', email: 'centro@example.com', phone: '', address: '', timezone: 'America/Argentina/Cordoba', openingTime: '08:00', closingTime: '21:00', operatingWeekdays: [1, 2, 3, 4, 5], status: 'active' as const }
        const created = await createBranchApi('academy-demo', input, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/branches', { method: 'POST', body: JSON.stringify(input) })
        expect(created).toEqual(apiBranch)
    })
    it('patches only the given branch fields', async () => {
        const request = vi.fn().mockResolvedValue(apiBranch)
        await updateBranchApi('academy-demo', 'b1', { status: 'inactive' }, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/branches/b1', { method: 'PATCH', body: JSON.stringify({ status: 'inactive' }) })
    })
    it('rejects a malformed response instead of returning bad data', async () => {
        const request = vi.fn().mockResolvedValue({ items: [{ ...apiBranch, status: 'unknown' }] })
        await expect(fetchBranches('academy-demo', undefined, request)).rejects.toThrow()
    })
    it('assigns a branch administrator with no body', async () => {
        const request = vi.fn().mockResolvedValue(undefined)
        await assignBranchAdministratorApi('academy-demo', 'b1', 'u1', request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/branches/b1/administrators/u1', { method: 'PUT' })
    })
    it('revokes a branch administrator with no body', async () => {
        const request = vi.fn().mockResolvedValue(undefined)
        await revokeBranchAdministratorApi('academy-demo', 'b1', 'u1', request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/branches/b1/administrators/u1', { method: 'DELETE' })
    })
    it('assigns a branch staff scope with no body', async () => {
        const request = vi.fn().mockResolvedValue(undefined)
        await assignBranchStaffApi('academy-demo', 'b1', 'u1', request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/branches/b1/staff/u1', { method: 'PUT' })
    })
    it('revokes a branch staff scope with no body', async () => {
        const request = vi.fn().mockResolvedValue(undefined)
        await revokeBranchStaffApi('academy-demo', 'b1', 'u1', request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/branches/b1/staff/u1', { method: 'DELETE' })
    })
})
