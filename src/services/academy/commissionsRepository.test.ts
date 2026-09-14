// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCommission, updateCommission } from './commissionsRepository'
import { listCourses } from './coursesRepository'

describe('commissions repository', () => {
    beforeEach(() => { window.localStorage.clear(); vi.restoreAllMocks() })

    it('rejects duplicate names and persists a unique commission', () => {
        const course = listCourses()[0]
        expect(createCommission(course.id, { ...course.commissions[0], name: ' grupo a ' })).toBeNull()
        vi.spyOn(Date, 'now').mockReturnValue(5_000)
        const created = createCommission(course.id, { ...course.commissions[0], name: 'Grupo C' })
        expect(created?.id).toBe('COM-5000')
        expect(listCourses()[0].commissions.some((commission) => commission.id === created?.id)).toBe(true)
    })

    it('prevents renaming a commission to an existing name', () => {
        const course = listCourses()[0]
        expect(updateCommission(course.id, course.commissions[1].id, { name: course.commissions[0].name })).toBe(false)
        expect(listCourses()[0].commissions[1].name).toBe(course.commissions[1].name)
    })
})
