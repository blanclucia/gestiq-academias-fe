// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAcademicCycle, getActiveAcademicCycleId, listCourses, replicateAcademicOffer } from './coursesRepository'

describe('courses repository', () => {
    beforeEach(() => { window.localStorage.clear(); vi.restoreAllMocks() })

    it('creates an active cycle and replicates offer with shifted dates', () => {
        vi.spyOn(Date, 'now').mockReturnValueOnce(4_000).mockReturnValueOnce(4_001)
        const cycle = createAcademicCycle({ name: 'Ciclo 2027', startDate: '2027-01-01', endDate: '2027-12-31', status: 'Borrador' })
        expect(getActiveAcademicCycleId()).toBe(cycle.id)
        const copies = replicateAcademicOffer('CYCLE-2026', cycle.id)
        expect(copies).toHaveLength(1)
        expect(copies[0]).toMatchObject({ cycleId: cycle.id, status: 'Borrador', studentsCount: 0 })
        expect(copies[0].commissions[0]).toMatchObject({ startDate: '2027-03-02', studentsCount: 0, status: 'Programada' })
        expect(listCourses().filter((course) => course.cycleId === cycle.id)).toHaveLength(1)
    })

    it('does not duplicate course names when replication runs twice', () => {
        const cycle = createAcademicCycle({ name: 'Ciclo 2027', startDate: '2027-01-01', endDate: '2027-12-31', status: 'Borrador' })
        replicateAcademicOffer('CYCLE-2026', cycle.id)
        expect(replicateAcademicOffer('CYCLE-2026', cycle.id)).toEqual([])
    })
})
