// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { updateAcademyState } from './academyState'
import type { EnrollmentOpening } from './academyTypes'
import { getPublicEnrollmentAvailability, listEnrollmentOpenings, type PublicEnrollmentOffer } from './enrollmentsRepository'

const opening: EnrollmentOpening = {
    id: '11111111-1111-4111-8111-000000000001', slug: 'curso-abcd1234', courseId: '22222222-2222-4222-8222-000000000001',
    commissionIds: ['33333333-3333-4333-8333-000000000001'], amount: 48000, startDate: '2026-08-01', endDate: '2026-09-30',
    status: 'Abierta', registrationsCount: 0,
}

describe('enrollments repository', () => {
    beforeEach(() => window.localStorage.clear())

    it('reads the local mirror kept warm by useEnrollmentOpenings()', () => {
        expect(listEnrollmentOpenings()).toEqual([])
        updateAcademyState((current) => ({ ...current, openings: [opening] }))
        expect(listEnrollmentOpenings()).toEqual([opening])
        expect(listEnrollmentOpenings(opening.courseId)).toEqual([opening])
        expect(listEnrollmentOpenings('other-course')).toEqual([])
    })
})

describe('getPublicEnrollmentAvailability', () => {
    const offer: PublicEnrollmentOffer = {
        slug: 'curso-abcd1234', openingId: 'o1', courseId: 'c1', courseName: 'Curso Inglés', amount: 48000,
        status: 'Abierta', startDate: '2026-08-01', endDate: '2026-09-30',
        commissions: [{ id: 'com1', name: 'Grupo A', schedule: 'Lun 18:00', amount: 48000, capacity: 2, occupied: 0, startDate: '2026-08-01', endDate: '2026-12-15' }],
    }

    it('is available when the opening is open, in range, and a commission has room', () => {
        expect(getPublicEnrollmentAvailability(offer, 'com1', '2026-09-09')).toEqual({ available: true, reason: '' })
    })
    it('is not available when the offer is missing', () => {
        expect(getPublicEnrollmentAvailability(undefined).available).toBe(false)
    })
    it('is not available when the selected commission has no capacity left', () => {
        const full: PublicEnrollmentOffer = { ...offer, commissions: [{ ...offer.commissions[0], occupied: 2 }] }
        expect(getPublicEnrollmentAvailability(full, 'com1', '2026-09-09').available).toBe(false)
    })
    it('is not available outside the opening period', () => {
        expect(getPublicEnrollmentAvailability(offer, 'com1', '2026-10-01').available).toBe(false)
    })
    it('is not available when the opening is not Abierta', () => {
        expect(getPublicEnrollmentAvailability({ ...offer, status: 'Cerrada' }, 'com1', '2026-09-09').available).toBe(false)
    })
})
