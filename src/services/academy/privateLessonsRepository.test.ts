// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { updateAcademyState } from './academyState'
import type { PrivateLesson } from './academyTypes'
import { listPrivateLessons } from './privateLessonsRepository'

const lesson: PrivateLesson = {
    id: '11111111-1111-4111-8111-000000000001', studentId: '22222222-2222-4222-8222-000000000002', teacherId: '33333333-3333-4333-8333-000000000003',
    purpose: 'Apoyo escolar', plan: 'Pack 8 clases', startDate: '2026-03-02', endDate: '2026-04-30', costPerClass: 4800,
    days: ['Lunes'], fromTime: '18:00', toTime: '19:00', status: 'Activa',
}

describe('private lessons repository', () => {
    beforeEach(() => window.localStorage.clear())

    it('reads the local mirror kept warm by usePrivateLessons()', () => {
        expect(listPrivateLessons()).toEqual([])
        updateAcademyState((current) => ({ ...current, privateLessons: [lesson] }))
        expect(listPrivateLessons()).toEqual([lesson])
    })
})
