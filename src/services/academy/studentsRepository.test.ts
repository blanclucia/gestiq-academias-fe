// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import type { Student } from '@/types/domain'
import { updateAcademyState } from './academyState'
import { assignStudentsToCommission } from './assignmentsRepository'
import { listStudents, listStudentsInCommission } from './studentsRepository'

const mirrored: Student = {
    id: '11111111-1111-4111-8111-111111111111', branchId: '22222222-2222-4222-8222-222222222222', firstName: 'Lucía', lastName: 'Gómez', fullName: 'Lucía Gómez',
    email: 'lucia@example.com', phone: '', document: '32108901', status: 'Activo', courses: [],
}

describe('students repository', () => {
    beforeEach(() => window.localStorage.clear())

    it('reads listStudents() from the backend mirror written by useStudents()', () => {
        updateAcademyState((current) => ({ ...current, students: [mirrored] }))
        expect(listStudents().map((student) => student.id)).toEqual([mirrored.id])
        expect(listStudents()[0].fullName).toBe('Lucía Gómez')
    })

    it('overlays commission assignments onto a mirrored student without duplicating them', () => {
        updateAcademyState((current) => ({ ...current, students: [mirrored] }))
        assignStudentsToCommission([mirrored.id], 'Inglés General', 'Grupo A', 48_000, 'COM-101')
        const student = listStudents().find((item) => item.id === mirrored.id)
        expect(student?.courses).toEqual([{ name: 'Inglés General', group: 'Grupo A', modality: 'Grupo' }])
        expect(listStudentsInCommission('Inglés General', 'Grupo A', 'COM-101').map((item) => item.id)).toEqual([mirrored.id])
    })

    it('does not show a student absent from the mirror (deleted or never fetched)', () => {
        updateAcademyState((current) => ({ ...current, students: [] }))
        expect(listStudents()).toEqual([])
    })
})
