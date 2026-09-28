import { describe, expect, it } from 'vitest'
import { studentStatusFromApi, studentStatusToApi } from './studentsMapping'

describe('student status mapping', () => {
    it('maps every status both ways', () => {
        expect(studentStatusToApi('Activo')).toBe('active')
        expect(studentStatusToApi('Pendiente')).toBe('pending')
        expect(studentStatusToApi('Inactivo')).toBe('inactive')
        expect(studentStatusFromApi('active')).toBe('Activo')
        expect(studentStatusFromApi('pending')).toBe('Pendiente')
        expect(studentStatusFromApi('inactive')).toBe('Inactivo')
    })
})
