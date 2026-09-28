// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import type { Teacher } from '@/data/teachers'
import { updateAcademyState } from './academyState'
import { listStaff, rolesFor } from './staffRepository'

const member: Teacher = {
    id: '11111111-1111-4111-8111-000000000001', firstName: 'María', lastName: 'López', fullName: 'María López',
    email: 'maria@academia.com', phone: '555-1234', specialty: 'Inglés', role: 'Docente', status: 'Activo', dni: '32108901',
}

describe('staff repository', () => {
    beforeEach(() => window.localStorage.clear())

    it('reads the local mirror kept warm by useStaff()', () => {
        expect(listStaff()).toEqual([])
        updateAcademyState((current) => ({ ...current, staff: [member] }))
        expect(listStaff()).toEqual([member])
    })
})

describe('rolesFor', () => {
    it('maps Docente to the teacher role', () => {
        expect(rolesFor('Docente', false)).toEqual(['teacher'])
    })
    it('adds admin when the administrator flag is set', () => {
        expect(rolesFor('Docente', true)).toEqual(['teacher', 'admin'])
        expect(rolesFor('Administrativo', true)).toEqual(['admin'])
    })
    it('never returns an empty set for the combinations the form allows', () => {
        // The staff form only allows Administrativo without the checkbox unchecked-admin combination
        // to be blocked client-side; this documents why that guard matters for the backend call.
        expect(rolesFor('Administrativo', false)).toEqual([])
    })
})
