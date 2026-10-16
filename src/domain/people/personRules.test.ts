import { describe, expect, it } from 'vitest'
import { isValidBirthDate, isValidDni, isValidPersonName, isValidPhone, normalizeDocument, normalizePersonName } from './personRules'

describe('personRules', () => {
    it('capitalizes names like the backend', () => {
        expect(normalizePersonName('LUcia')).toBe('Lucia')
        expect(normalizePersonName('  lucía   BLANC ')).toBe('Lucía Blanc')
        expect(normalizePersonName('MARÍA DE LA FUENTE')).toBe('María de la Fuente')
        expect(normalizePersonName('ana-laura d\'angelo')).toBe('Ana-Laura D\'Angelo')
    })

    it('accepts names with letters only', () => {
        expect(isValidPersonName('Ñandú D\'Angelo-Pérez')).toBe(true)
        expect(isValidPersonName('123')).toBe(false)
        expect(isValidPersonName('.')).toBe(false)
    })

    it('normalizes and validates a DNI', () => {
        expect(normalizeDocument(' 30.111.222 ')).toBe('30111222')
        expect(isValidDni('30111222')).toBe(true)
        expect(isValidDni('5111222')).toBe(true)
        expect(isValidDni('123')).toBe(false)
        expect(isValidDni('30A11222')).toBe(false)
    })

    it('validates phones and birth dates', () => {
        expect(isValidPhone('+54 9 341 555-1234')).toBe(true)
        expect(isValidPhone('asd')).toBe(false)
        expect(isValidPhone('1234')).toBe(false)
        const today = new Date(2026, 9, 16)
        expect(isValidBirthDate('2010-10-16', today)).toBe(true)
        expect(isValidBirthDate('2026-10-17', today)).toBe(false)
        expect(isValidBirthDate('1925-01-01', today)).toBe(false)
    })
})
