import { describe, expect, it } from 'vitest'
import { getCommissionMonthlyDueDates, getNextDueDateForDay, splitInstallments } from './billingRules'

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

    it('picks the day within this month when it has not passed yet', () => {
        expect(getNextDueDateForDay(15, '2026-03-01')).toBe('2026-03-15')
        expect(getNextDueDateForDay(15, '2026-03-15')).toBe('2026-03-15')
    })

    it('rolls over to next month once the day already passed', () => {
        expect(getNextDueDateForDay(10, '2026-03-15')).toBe('2026-04-10')
        expect(getNextDueDateForDay(10, '2026-12-15')).toBe('2027-01-10')
    })

    it('clamps to the last real day of a shorter month', () => {
        expect(getNextDueDateForDay(31, '2026-02-01')).toBe('2026-02-28')
        expect(getNextDueDateForDay(31, '2026-02-28')).toBe('2026-02-28')
    })

    it('clamps to the shorter next month when rolling over', () => {
        expect(getNextDueDateForDay(30, '2026-01-31')).toBe('2026-02-28')
    })
})
