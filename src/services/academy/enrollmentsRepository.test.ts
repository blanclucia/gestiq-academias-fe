// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { confirmPayment, createEnrollmentOpening, createPublicRegistration, getPublicEnrollmentAvailability, getPublicEnrollmentOffer, listPublicRegistrations } from './enrollmentsRepository'

describe('enrollments repository', () => {
    beforeEach(() => { window.localStorage.clear(); vi.restoreAllMocks() })

    it('resolves seed offers and their availability', () => {
        expect(getPublicEnrollmentOffer('ingles-general-open-1001')).toMatchObject({ courseId: 'C-220', courseName: 'Inglés General' })
        expect(getPublicEnrollmentAvailability('ingles-general-open-1001', 'COM-101', '2026-09-09')).toEqual({ available: true, reason: '' })
        expect(getPublicEnrollmentAvailability('missing', undefined, '2026-09-09').available).toBe(false)
    })

    it('creates and confirms a public registration', () => {
        vi.spyOn(Date, 'now').mockReturnValue(6_000)
        const registration = createPublicRegistration({ offerSlug: 'ingles-general-open-1001', openingId: 'OPEN-1001', commissionId: 'COM-101', firstName: 'Ada', lastName: 'Lovelace', fullName: 'Ada Lovelace', document: 'DOC-6000', email: 'ada@example.com', phone: '555', birthDate: '2000-01-01' })
        expect(registration.id).toBe('REG-6000')
        expect(confirmPayment(registration.id, 'Transferencia')).toMatchObject({ paid: true, confirmed: true, paymentMethod: 'Transferencia' })
        expect(listPublicRegistrations('OPEN-1001')[0].paid).toBe(true)
    })

    it('generates a stable slug for a new opening', () => {
        vi.spyOn(Date, 'now').mockReturnValue(6_001)
        expect(createEnrollmentOpening({ courseId: 'C-220', startDate: '2026-10-01', endDate: '2026-10-31', status: 'Programada', amount: 20_000 }).slug).toBe('ingles-general-open-6001')
    })
})
