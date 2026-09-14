import { describe, expect, it } from 'vitest'
import { getCommissionMonthlyDueDates, splitInstallments } from './billingRules'

describe('billing rules', () => {
    it('generates one clamped due date per commission month', () => {
        expect(getCommissionMonthlyDueDates({ startDate: '2026-03-15', endDate: '2026-05-05', dueDay: 10 }))
            .toEqual(['2026-03-15', '2026-04-10', '2026-05-05'])
    })

    it('does not generate installments for an invalid period', () => {
        expect(getCommissionMonthlyDueDates({ startDate: '2026-05-01', endDate: '2026-04-01', dueDay: 10 })).toEqual([])
    })

    it('preserves the exact total when rounding installments', () => {
        const installments = splitInstallments(10_000, 3)
        expect(installments).toEqual([3333, 3333, 3334])
        expect(installments.reduce((sum, amount) => sum + amount, 0)).toBe(10_000)
    })
})
