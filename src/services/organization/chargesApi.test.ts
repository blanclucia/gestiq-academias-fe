import { describe, expect, it, vi } from 'vitest'
import { createChargeApi, deleteChargeApi, fetchCharges, generateTuitionApi, updateChargeApi } from './chargesApi'

const apiCharge = {
    id: 'c1', organizationId: 'org1', source: 'manual' as const, studentId: 's1', concept: 'Matrícula',
    amount: 5000, dueDate: '2026-03-10', status: 'pending' as const, notes: '',
}

describe('charges API client', () => {
    it('lists charges for an organization with no filters', async () => {
        const request = vi.fn().mockResolvedValue({ items: [apiCharge] })
        const charges = await fetchCharges('academy-demo', {}, undefined, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/charges', expect.objectContaining({ signal: undefined }))
        expect(charges).toEqual([apiCharge])
    })
    it('lists charges with query filters', async () => {
        const request = vi.fn().mockResolvedValue({ items: [] })
        await fetchCharges('academy-demo', { studentId: 's1', commissionId: 'm1', status: 'pending' }, undefined, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/charges?studentId=s1&commissionId=m1&status=pending', expect.objectContaining({ signal: undefined }))
    })
    it('creates a manual charge with the given payload', async () => {
        const request = vi.fn().mockResolvedValue(apiCharge)
        const input = { studentId: 's1', concept: 'Matrícula', amount: 5000, dueDate: '2026-03-10', notes: '' }
        const created = await createChargeApi('academy-demo', input, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/charges', { method: 'POST', body: JSON.stringify(input) })
        expect(created).toEqual(apiCharge)
    })
    it('patches only the given charge fields', async () => {
        const request = vi.fn().mockResolvedValue(apiCharge)
        await updateChargeApi('academy-demo', 'c1', { status: 'paid' }, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/charges/c1', { method: 'PATCH', body: JSON.stringify({ status: 'paid' }) })
    })
    it('deletes a charge with no body', async () => {
        const request = vi.fn().mockResolvedValue(undefined)
        await deleteChargeApi('academy-demo', 'c1', request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/charges/c1', { method: 'DELETE' })
    })
    it('generates tuition charges for a student in a commission', async () => {
        const request = vi.fn().mockResolvedValue({ items: [apiCharge] })
        const charges = await generateTuitionApi('academy-demo', 's1', 'm1', request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/charges/generate-tuition', { method: 'POST', body: JSON.stringify({ studentId: 's1', commissionId: 'm1' }) })
        expect(charges).toEqual([apiCharge])
    })
    it('rejects a malformed response instead of returning bad data', async () => {
        const request = vi.fn().mockResolvedValue({ items: [{ ...apiCharge, status: 'graduated' }] })
        await expect(fetchCharges('academy-demo', {}, undefined, request)).rejects.toThrow()
    })
})
