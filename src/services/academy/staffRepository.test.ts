// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { initialTeachers } from '@/data/teachers'
import { listStaff, removeStaff, updateStaff } from './staffRepository'

describe('staff repository', () => {
    beforeEach(() => window.localStorage.clear())

    it('overrides and tombstones seed staff safely', () => {
        const teacher = initialTeachers[0]
        updateStaff(teacher.id, { phone: '555-STAFF' })
        expect(listStaff().find((member) => member.id === teacher.id)?.phone).toBe('555-STAFF')
        removeStaff(teacher.id)
        expect(listStaff().some((member) => member.id === teacher.id)).toBe(false)
    })
})
