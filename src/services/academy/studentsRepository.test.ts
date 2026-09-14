// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initialStudents } from '@/data/students'
import { createStudent, listStudents, removeStudent, updateStudent } from './studentsRepository'

describe('students repository', () => {
    beforeEach(() => { window.localStorage.clear(); vi.restoreAllMocks() })

    it('creates, updates and removes a stored student', () => {
        vi.spyOn(Date, 'now').mockReturnValue(3_000)
        const { id: _seedId, ...input } = initialStudents[0]
        const created = createStudent({ ...input, document: 'NEW-3000' })
        expect(created.id).toBe('ST-3000')
        updateStudent(created.id, { firstName: 'Actualizado', fullName: 'Actualizado Alumno' })
        expect(listStudents().find((student) => student.id === created.id)?.firstName).toBe('Actualizado')
        removeStudent(created.id)
        expect(listStudents().some((student) => student.id === created.id)).toBe(false)
        expect(_seedId).toBeTruthy()
    })

    it('stores an override when editing a seed student', () => {
        updateStudent(initialStudents[0].id, { phone: '555-TEST' })
        expect(listStudents().find((student) => student.id === initialStudents[0].id)?.phone).toBe('555-TEST')
    })
})
