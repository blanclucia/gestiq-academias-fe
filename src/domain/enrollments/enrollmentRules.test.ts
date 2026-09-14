import { describe, expect, it } from 'vitest'
import { resolveEnrollmentAvailability } from './enrollmentRules'

const availableInput = { exists: true, status: 'Abierta', date: '2026-09-10', startDate: '2026-09-01', endDate: '2026-09-30', commissionCount: 2, commissionSelected: false, selectedCommissionExists: true, hasCapacity: true }

describe('enrollment availability rules', () => {
    it('allows an active opening with capacity', () => {
        expect(resolveEnrollmentAvailability(availableInput)).toEqual({ available: true, reason: '' })
    })

    it('rejects invalid links, dates and unavailable commissions', () => {
        expect(resolveEnrollmentAvailability({ ...availableInput, exists: false }).reason).toContain('no existe')
        expect(resolveEnrollmentAvailability({ ...availableInput, date: '2026-10-01' }).reason).toContain('período')
        expect(resolveEnrollmentAvailability({ ...availableInput, commissionSelected: true, selectedCommissionExists: false }).reason).toContain('no está disponible')
    })

    it('uses a specific capacity message when a commission was selected', () => {
        expect(resolveEnrollmentAvailability({ ...availableInput, commissionSelected: true, hasCapacity: false }).reason).toContain('esta comisión')
    })
})
