import { describe, expect, it, vi } from 'vitest'
import { confirmRegistrationApi, createEnrollmentOpeningApi, deleteEnrollmentOpeningApi, fetchEnrollmentOpenings, fetchEnrollmentRegistrations, fetchPublicOffer, registerPubliclyApi, updateEnrollmentOpeningApi, updateRegistrationNotesApi } from './enrollmentsApi'

const apiOpening = {
    id: 'o1', organizationId: 'org1', slug: 'curso-abcd1234', courseId: 'c1', commissionIds: ['m1'], amount: 48000,
    startDate: '2026-08-01', endDate: '2026-09-30', status: 'open' as const, registrationsCount: 0,
    createdAt: '2026-08-01T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z',
}
const apiRegistration = {
    id: 'r1', studentId: 's1', studentFullName: 'Lucía Gómez', studentEmail: 'lucia@example.com', studentPhone: '555',
    commissionId: 'm1', commissionName: 'Grupo A', chargeId: 'ch1', chargeStatus: 'pending' as const, chargeAmount: 48000,
    rosterConfirmed: true, adminNotes: '', createdAt: '2026-08-02T00:00:00Z',
}
const apiPublicOffer = {
    openingId: 'o1', slug: 'curso-abcd1234', courseId: 'c1', courseName: 'Curso Inglés', amount: 48000, status: 'open' as const,
    startDate: '2026-08-01', endDate: '2026-09-30',
    commissions: [{ id: 'm1', name: 'Grupo A', schedule: 'Lun 18:00', amount: 48000, capacity: 20, occupied: 3, startDate: '2026-08-01', endDate: '2026-12-15' }],
}
const apiRegistrationResult = { id: 'r1', fullName: 'Lucía Gómez', chargeId: 'ch1', amount: 48000 }

describe('enrollments API client (admin)', () => {
    it('lists openings for an organization with no filters', async () => {
        const request = vi.fn().mockResolvedValue({ items: [apiOpening] })
        const openings = await fetchEnrollmentOpenings('academy-demo', {}, undefined, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/enrollment-openings', expect.objectContaining({ signal: undefined }))
        expect(openings).toEqual([apiOpening])
    })
    it('lists openings filtered by courseId', async () => {
        const request = vi.fn().mockResolvedValue({ items: [] })
        await fetchEnrollmentOpenings('academy-demo', { courseId: 'c1' }, undefined, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/enrollment-openings?courseId=c1', expect.objectContaining({ signal: undefined }))
    })
    it('creates an opening with the given payload', async () => {
        const request = vi.fn().mockResolvedValue(apiOpening)
        const input = { courseId: 'c1', commissionIds: ['m1'], amount: 48000, startDate: '2026-08-01', endDate: '2026-09-30', status: 'open' as const }
        const created = await createEnrollmentOpeningApi('academy-demo', input, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/enrollment-openings', { method: 'POST', body: JSON.stringify(input) })
        expect(created).toEqual(apiOpening)
    })
    it('patches only the given opening fields', async () => {
        const request = vi.fn().mockResolvedValue(apiOpening)
        await updateEnrollmentOpeningApi('academy-demo', 'o1', { amount: 52000 }, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/enrollment-openings/o1', { method: 'PATCH', body: JSON.stringify({ amount: 52000 }) })
    })
    it('deletes an opening with no body', async () => {
        const request = vi.fn().mockResolvedValue(undefined)
        await deleteEnrollmentOpeningApi('academy-demo', 'o1', request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/enrollment-openings/o1', { method: 'DELETE' })
    })
    it('lists registrations for an opening', async () => {
        const request = vi.fn().mockResolvedValue({ items: [apiRegistration] })
        const registrations = await fetchEnrollmentRegistrations('academy-demo', 'o1', undefined, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/enrollment-openings/o1/registrations', expect.objectContaining({ signal: undefined }))
        expect(registrations).toEqual([apiRegistration])
    })
    it('updates a registration´s admin notes', async () => {
        const request = vi.fn().mockResolvedValue(apiRegistration)
        await updateRegistrationNotesApi('academy-demo', 'r1', 'Llamó por WhatsApp', request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/enrollment-registrations/r1', { method: 'PATCH', body: JSON.stringify({ adminNotes: 'Llamó por WhatsApp' }) })
    })
    it('confirms a registration with no body', async () => {
        const request = vi.fn().mockResolvedValue(apiRegistration)
        await confirmRegistrationApi('academy-demo', 'r1', request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/enrollment-registrations/r1/confirm', { method: 'POST' })
    })
})

describe('enrollments API client (public)', () => {
    it('fetches a public offer by slug', async () => {
        const request = vi.fn().mockResolvedValue(apiPublicOffer)
        const offer = await fetchPublicOffer('academy-demo', 'curso-abcd1234', undefined, request)
        expect(request).toHaveBeenCalledWith('/public/organizations/academy-demo/enrollment-offers/curso-abcd1234', expect.objectContaining({ signal: undefined }))
        expect(offer).toEqual(apiPublicOffer)
    })
    it('registers publicly with the given payload', async () => {
        const request = vi.fn().mockResolvedValue(apiRegistrationResult)
        const input = { commissionId: 'm1', firstName: 'Lucía', lastName: 'Gómez', document: '32108901' }
        const result = await registerPubliclyApi('academy-demo', 'curso-abcd1234', input, request)
        expect(request).toHaveBeenCalledWith('/public/organizations/academy-demo/enrollment-offers/curso-abcd1234/registrations', { method: 'POST', body: JSON.stringify(input) })
        expect(result).toEqual(apiRegistrationResult)
    })
    it('rejects a malformed offer response instead of returning bad data', async () => {
        const request = vi.fn().mockResolvedValue({ ...apiPublicOffer, status: 'invalid' })
        await expect(fetchPublicOffer('academy-demo', 'curso-abcd1234', undefined, request)).rejects.toThrow()
    })
})
