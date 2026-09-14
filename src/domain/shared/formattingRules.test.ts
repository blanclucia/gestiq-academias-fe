import { describe, expect, it } from 'vitest'
import { formatCurrencyARS, formatShortDate } from './formattingRules'

describe('shared formatting rules', () => {
    it('formats ISO dates and missing values', () => {
        expect(formatShortDate('2026-09-10')).toBe('10/09/2026')
        expect(formatShortDate(undefined)).toBe('Sin vencimiento')
    })

    it('formats Argentine currency without decimals', () => {
        expect(formatCurrencyARS(12500)).toContain('12.500')
    })
})
