import { describe, expect, it } from 'vitest'
import { calculateAge, isMinor } from './studentRules'

describe('student rules', () => {
    const today = new Date(2026, 8, 9, 12)

    it('accounts for whether the birthday has happened', () => {
        expect(calculateAge('2008-09-10', today)).toBe(17)
        expect(calculateAge('2008-09-09', today)).toBe(18)
    })

    it('identifies minors', () => {
        expect(isMinor('2010-01-01', today)).toBe(true)
        expect(isMinor('2000-01-01', today)).toBe(false)
    })
})
