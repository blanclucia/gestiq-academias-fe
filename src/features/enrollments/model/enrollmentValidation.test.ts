import { describe, expect, it } from 'vitest'
import { validateEnrollment } from './enrollmentValidation'

const commission = { id: 'COM-1', name: 'A', teacher: '', teachers: [], schedule: '', studentsCount: 0, capacity: 10, amount: 100, startDate: '2026-03-01', endDate: '2026-12-01', dueDay: 10, status: 'Activa' as const }

describe('enrollment validation', () => {
    it('requires an ordered period and an eligible commission', () => {
        const result = validateEnrollment({ courseId: 'C-1', commissionIds: [], amount: -1, startDate: '2026-06-02', endDate: '2026-06-01', status: 'Abierta' }, [commission])
        expect(result.fieldErrors).toMatchObject({ enrollmentAmount: expect.any(String), enrollmentEndDate: expect.any(String), enrollmentCommissions: expect.any(String) })
    })
    it('accepts a selected commission overlapping the period', () => {
        expect(validateEnrollment({ courseId: 'C-1', commissionIds: ['COM-1'], amount: 0, startDate: '2026-06-01', endDate: '2026-06-30', status: 'Abierta' }, [commission]).valid).toBe(true)
    })
})
