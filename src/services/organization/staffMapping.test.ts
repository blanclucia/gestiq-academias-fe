import { describe, expect, it } from 'vitest'
import { staffRoleFromApi, staffRoleToApi, staffStatusFromApi, staffStatusToApi } from './staffMapping'

describe('staff role and status mapping', () => {
    it('maps role both ways', () => {
        expect(staffRoleToApi('Docente')).toBe('teacher')
        expect(staffRoleToApi('Administrativo')).toBe('administrative')
        expect(staffRoleFromApi('teacher')).toBe('Docente')
        expect(staffRoleFromApi('administrative')).toBe('Administrativo')
    })
    it('maps status both ways', () => {
        expect(staffStatusToApi('Activo')).toBe('active')
        expect(staffStatusToApi('Inactivo')).toBe('inactive')
        expect(staffStatusFromApi('active')).toBe('Activo')
        expect(staffStatusFromApi('inactive')).toBe('Inactivo')
    })
})
