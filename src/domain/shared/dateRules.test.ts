import { describe, expect, it } from 'vitest'
import { addMonthsToDate } from './dateRules'

describe('date rules', () => {
    it('clamps recurring dates to the last day of shorter months', () => {
        expect(addMonthsToDate('2026-01-31', 1)).toBe('2026-02-28')
        expect(addMonthsToDate('2024-01-31', 1)).toBe('2024-02-29')
    })
})
