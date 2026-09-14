// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { listPrivateLessons, updatePrivateLesson } from './privateLessonsRepository'

describe('private lessons repository', () => {
    beforeEach(() => window.localStorage.clear())

    it('stores an override for a seed lesson without duplicating it', () => {
        updatePrivateLesson('PR-1001', { status: 'Pausada', costPerClass: 5_000 })
        expect(listPrivateLessons().filter((lesson) => lesson.id === 'PR-1001')).toEqual([expect.objectContaining({ status: 'Pausada', costPerClass: 5_000 })])
    })
})
