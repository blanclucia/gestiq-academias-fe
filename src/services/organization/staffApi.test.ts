import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/services/http/client'
import { createStaffApi, deleteStaffApi, fetchStaff, isStaffDniConflict, updateStaffApi } from './staffApi'

const apiStaff = {
    id: 'st1', organizationId: 'org1', firstName: 'María', lastName: 'López', fullName: 'María López',
    email: 'maria@academia.com', phone: '', specialty: 'Inglés', dni: '32108901', role: 'teacher' as const, status: 'active' as const,
}

describe('staff API client', () => {
    it('lists staff for an organization', async () => {
        const request = vi.fn().mockResolvedValue({ items: [apiStaff] })
        const staff = await fetchStaff('academy-demo', undefined, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/staff', expect.objectContaining({ signal: undefined }))
        expect(staff).toEqual([apiStaff])
    })
    it('creates a staff member with the given payload', async () => {
        const request = vi.fn().mockResolvedValue(apiStaff)
        const input = { firstName: 'María', lastName: 'López', email: 'maria@academia.com', phone: '', specialty: 'Inglés', dni: '32108901', role: 'teacher' as const, status: 'active' as const, userId: 'u1' }
        const created = await createStaffApi('academy-demo', input, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/staff', { method: 'POST', body: JSON.stringify(input) })
        expect(created).toEqual(apiStaff)
    })
    it('patches only the given staff fields', async () => {
        const request = vi.fn().mockResolvedValue(apiStaff)
        await updateStaffApi('academy-demo', 'st1', { status: 'inactive' }, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/staff/st1', { method: 'PATCH', body: JSON.stringify({ status: 'inactive' }) })
    })
    it('deletes a staff member with no body', async () => {
        const request = vi.fn().mockResolvedValue(undefined)
        await deleteStaffApi('academy-demo', 'st1', request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/staff/st1', { method: 'DELETE' })
    })
    it('rejects a malformed response instead of returning bad data', async () => {
        const request = vi.fn().mockResolvedValue({ items: [{ ...apiStaff, role: 'owner' }] })
        await expect(fetchStaff('academy-demo', undefined, request)).rejects.toThrow()
    })
    it('recognizes a DNI conflict error', () => {
        expect(isStaffDniConflict(new ApiError(409, 'staff_dni_conflict'))).toBe(true)
        expect(isStaffDniConflict(new ApiError(409, 'other_conflict'))).toBe(false)
        expect(isStaffDniConflict(new Error('boom'))).toBe(false)
    })
})
