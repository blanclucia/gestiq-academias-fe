// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { updateAcademyState } from './academyState'
import type { AcademicCourse } from './academyTypes'
import { getCommissionRemovalBlockers, getCourseRemovalBlockers } from './commissionsRepository'

const course: AcademicCourse = {
    id: '22222222-2222-4222-8222-000000000001', branchId: '33333333-3333-4333-8333-000000000001', cycleId: '11111111-1111-4111-8111-000000000001', name: 'Inglés General', studentsCount: 2, status: 'Activo',
    commissions: [{ id: 'c1', name: 'Grupo A', teacher: 'María López', teachers: ['María López'], schedule: 'Lun 18:00', studentsCount: 2, capacity: 20, amount: 48000, startDate: '2026-03-01', endDate: '2026-12-15', dueDay: 10, status: 'Activa' }],
}

describe('commissions repository blockers', () => {
    beforeEach(() => window.localStorage.clear())

    it('reports assigned students from the real (mirrored) roster count, not local assignments', () => {
        updateAcademyState((current) => ({ ...current, courses: [course] }))
        expect(getCourseRemovalBlockers(course.id)).toEqual(['2 alumnos asignados'])
        expect(getCommissionRemovalBlockers(course.id, 'c1')).toEqual(['2 alumnos asignados'])
    })

    it('returns no blockers for a course/commission with an empty roster', () => {
        const empty: AcademicCourse = { ...course, studentsCount: 0, commissions: [{ ...course.commissions[0], studentsCount: 0 }] }
        updateAcademyState((current) => ({ ...current, courses: [empty] }))
        expect(getCourseRemovalBlockers(empty.id)).toEqual([])
        expect(getCommissionRemovalBlockers(empty.id, 'c1')).toEqual([])
    })

    it('returns no blockers for a course/commission that no longer exists', () => {
        updateAcademyState((current) => ({ ...current, courses: [] }))
        expect(getCourseRemovalBlockers('missing')).toEqual([])
        expect(getCommissionRemovalBlockers('missing', 'missing')).toEqual([])
    })
})
