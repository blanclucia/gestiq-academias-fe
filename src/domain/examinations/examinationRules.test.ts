import { describe, expect, it } from 'vitest'
import { getActiveExamStudents, resolveExamStudentIds } from './examinationRules'

const students = [{ id: 'active', status: 'Activo' }, { id: 'paused', status: 'Pausado' }, { id: 'other', status: 'Activo' }]

describe('examination rules', () => {
    it('returns only active candidates', () => {
        expect(getActiveExamStudents(students).map((student) => student.id)).toEqual(['active', 'other'])
    })

    it('resolves all or selected active students', () => {
        expect(resolveExamStudentIds(students, 'all', [])).toEqual(['active', 'other'])
        expect(resolveExamStudentIds(students, 'selected', ['paused', 'other'])).toEqual(['other'])
    })
})
