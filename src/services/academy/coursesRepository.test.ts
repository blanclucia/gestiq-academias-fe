// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { updateAcademyState } from './academyState'
import type { AcademicCourse, AcademicCycle } from './academyTypes'
import { getActiveAcademicCycleId, listAcademicCycles, listCourses } from './coursesRepository'

const cycle: AcademicCycle = { id: '11111111-1111-4111-8111-000000000001', name: 'Ciclo 2026', startDate: '2026-01-01', endDate: '2026-12-31', status: 'Activo' }
const course: AcademicCourse = { id: '22222222-2222-4222-8222-000000000001', branchId: '33333333-3333-4333-8333-000000000001', cycleId: cycle.id, name: 'Inglés General', studentsCount: 0, status: 'Activo', commissions: [] }

describe('courses repository', () => {
    beforeEach(() => window.localStorage.clear())

    it('reads listAcademicCycles()/getActiveAcademicCycleId() from the backend mirror', () => {
        updateAcademyState((current) => ({ ...current, cycles: [cycle], activeCycleId: cycle.id }))
        expect(listAcademicCycles()).toEqual([cycle])
        expect(getActiveAcademicCycleId()).toBe(cycle.id)
    })

    it('reads listCourses() from the backend mirror, with nested commissions untouched', () => {
        const withCommission: AcademicCourse = { ...course, commissions: [{ id: 'c1', name: 'Grupo A', teacher: 'María López', teachers: ['María López'], schedule: 'Lun 18:00', studentsCount: 2, capacity: 20, amount: 48000, startDate: '2026-03-01', endDate: '2026-12-15', dueDay: 10, status: 'Activa' }] }
        updateAcademyState((current) => ({ ...current, courses: [withCommission] }))
        expect(listCourses()).toEqual([withCommission])
    })

    it('returns an empty mirror as empty, not undefined', () => {
        updateAcademyState((current) => ({ ...current, courses: [], cycles: [], activeCycleId: '' }))
        expect(listCourses()).toEqual([])
        expect(listAcademicCycles()).toEqual([])
        expect(getActiveAcademicCycleId()).toBe('')
    })
})
