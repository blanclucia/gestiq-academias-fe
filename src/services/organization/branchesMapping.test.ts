import { describe, expect, it } from 'vitest'
import { branchStatusFromApi, branchStatusToApi, generateDisplayCode, operatingToWeekDays, weekDaysToOperating } from './branchesMapping'

describe('branch field mapping', () => {
    it('converts weekday names to ISO weekday numbers and back', () => {
        expect(weekDaysToOperating(['Lunes', 'Miércoles', 'Viernes'])).toEqual([1, 3, 5])
        expect(operatingToWeekDays([1, 3, 5])).toEqual(['Lunes', 'Miércoles', 'Viernes'])
    })
    it('sorts and de-duplicates weekdays regardless of input order', () => {
        expect(weekDaysToOperating(['Viernes', 'Lunes', 'Lunes'])).toEqual([1, 5])
    })
    it('drops unrecognized weekday names', () => {
        expect(weekDaysToOperating(['Lunes', 'Feriado'])).toEqual([1])
    })
    it('maps status both ways', () => {
        expect(branchStatusToApi('Activa')).toBe('active')
        expect(branchStatusToApi('Inactiva')).toBe('inactive')
        expect(branchStatusFromApi('active')).toBe('Activa')
        expect(branchStatusFromApi('inactive')).toBe('Inactiva')
    })
    it('generates a displayCode that satisfies the backend regex', () => {
        const code = generateDisplayCode('Sede San José 2')
        expect(code).toMatch(/^[A-Z0-9][A-Z0-9_-]{0,31}$/)
    })
    it('falls back to a safe prefix when the name has no alphanumeric characters', () => {
        const code = generateDisplayCode('★★★')
        expect(code).toMatch(/^SEDE_[A-Z0-9]+$/)
    })
})
