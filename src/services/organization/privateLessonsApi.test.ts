import { describe, expect, it, vi } from 'vitest'
import { createPrivateLessonApi, fetchPrivateLessons, updatePrivateLessonApi } from './privateLessonsApi'

const apiPrivateLesson = {
    id: 'pl1', organizationId: 'org1', studentId: 's1', teacherId: 't1', purpose: 'Apoyo escolar', plan: 'pack8' as const,
    costPerClass: 4800, startDate: '2026-03-02', endDate: '2026-04-30', days: ['Lunes'], fromTime: '18:00', toTime: '19:00', status: 'active' as const,
}

describe('private lessons API client', () => {
    it('lists private lessons for an organization with no filters', async () => {
        const request = vi.fn().mockResolvedValue({ items: [apiPrivateLesson] })
        const lessons = await fetchPrivateLessons('academy-demo', {}, undefined, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/private-lessons', expect.objectContaining({ signal: undefined }))
        expect(lessons).toEqual([apiPrivateLesson])
    })
    it('lists private lessons with query filters', async () => {
        const request = vi.fn().mockResolvedValue({ items: [] })
        await fetchPrivateLessons('academy-demo', { studentId: 's1', teacherId: 't1', status: 'active' }, undefined, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/private-lessons?studentId=s1&teacherId=t1&status=active', expect.objectContaining({ signal: undefined }))
    })
    it('creates a private lesson with the given payload', async () => {
        const request = vi.fn().mockResolvedValue(apiPrivateLesson)
        const input = { studentId: 's1', teacherId: 't1', purpose: 'Apoyo escolar', plan: 'pack8' as const, costPerClass: 4800, startDate: '2026-03-02', endDate: '2026-04-30', days: ['Lunes'], fromTime: '18:00', toTime: '19:00' }
        const created = await createPrivateLessonApi('academy-demo', input, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/private-lessons', { method: 'POST', body: JSON.stringify(input) })
        expect(created).toEqual(apiPrivateLesson)
    })
    it('patches only the given private lesson fields', async () => {
        const request = vi.fn().mockResolvedValue(apiPrivateLesson)
        await updatePrivateLessonApi('academy-demo', 'pl1', { costPerClass: 5200, status: 'finished' }, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/private-lessons/pl1', { method: 'PATCH', body: JSON.stringify({ costPerClass: 5200, status: 'finished' }) })
    })
    it('rejects a malformed response instead of returning bad data', async () => {
        const request = vi.fn().mockResolvedValue({ items: [{ ...apiPrivateLesson, plan: 'invalid' }] })
        await expect(fetchPrivateLessons('academy-demo', {}, undefined, request)).rejects.toThrow()
    })
})
