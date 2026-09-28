import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/services/http/client'
import {
    activateAcademicCycleApi, assignEnrollmentApi, createAcademicCycleApi, createCommissionApi, createCourseApi, deleteCommissionApi, deleteCourseApi,
    fetchAcademicCycles, fetchCommissionRoster, fetchCourse, fetchCourses, isCommissionHasActiveRoster, isCommissionNameConflict, isCourseHasActiveCommissions,
    revokeEnrollmentApi, updateCommissionApi, updateCourseApi,
} from './academicOffersApi'

const apiCommission = {
    id: 'm1', organizationId: 'org1', courseId: 'c1', name: 'Grupo A', teachers: ['María López'], schedule: 'Lun 18:00',
    capacity: 20, amount: 48000, startDate: '2026-03-01', endDate: '2026-12-15', dueDay: 10, status: 'scheduled' as const, studentsCount: 0,
}
const apiCourse = {
    id: 'c1', organizationId: 'org1', branchId: 'b1', cycleId: 'cy1', name: 'Inglés General', description: '',
    status: 'active' as const, commissionsCount: 1, studentsCount: 0, commissions: [apiCommission],
}
const apiCycle = { id: 'cy1', organizationId: 'org1', name: 'Ciclo 2026', startDate: '2026-01-01', endDate: '2026-12-31', status: 'draft' as const, active: false }

describe('academic offers API client', () => {
    it('lists academic cycles', async () => {
        const request = vi.fn().mockResolvedValue({ items: [apiCycle] })
        const cycles = await fetchAcademicCycles('academy-demo', undefined, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/academic-cycles', expect.objectContaining({ signal: undefined }))
        expect(cycles).toEqual([apiCycle])
    })
    it('creates an academic cycle', async () => {
        const request = vi.fn().mockResolvedValue(apiCycle)
        const input = { name: 'Ciclo 2026', startDate: '2026-01-01', endDate: '2026-12-31', status: 'draft' as const }
        await createAcademicCycleApi('academy-demo', input, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/academic-cycles', { method: 'POST', body: JSON.stringify(input) })
    })
    it('activates an academic cycle with no body', async () => {
        const request = vi.fn().mockResolvedValue(undefined)
        await activateAcademicCycleApi('academy-demo', 'cy1', request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/academic-cycles/cy1/activate', { method: 'PUT' })
    })
    it('lists courses with nested commissions', async () => {
        const request = vi.fn().mockResolvedValue({ items: [apiCourse] })
        const courses = await fetchCourses('academy-demo', undefined, request)
        expect(courses).toEqual([apiCourse])
        expect(courses[0].commissions).toEqual([apiCommission])
    })
    it('fetches a single course', async () => {
        const request = vi.fn().mockResolvedValue(apiCourse)
        const course = await fetchCourse('academy-demo', 'c1', undefined, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/courses/c1', expect.objectContaining({ signal: undefined }))
        expect(course).toEqual(apiCourse)
    })
    it('creates a course', async () => {
        const request = vi.fn().mockResolvedValue(apiCourse)
        const input = { branchId: 'b1', cycleId: 'cy1', name: 'Inglés General', description: '', status: 'active' as const }
        await createCourseApi('academy-demo', input, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/courses', { method: 'POST', body: JSON.stringify(input) })
    })
    it('patches a course', async () => {
        const request = vi.fn().mockResolvedValue(apiCourse)
        await updateCourseApi('academy-demo', 'c1', { status: 'closed' }, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/courses/c1', { method: 'PATCH', body: JSON.stringify({ status: 'closed' }) })
    })
    it('deletes a course', async () => {
        const request = vi.fn().mockResolvedValue(undefined)
        await deleteCourseApi('academy-demo', 'c1', request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/courses/c1', { method: 'DELETE' })
    })
    it('creates a commission within a course', async () => {
        const request = vi.fn().mockResolvedValue(apiCommission)
        const input = { name: 'Grupo A', teachers: [], schedule: '', capacity: 20, amount: 0, startDate: '', endDate: '', dueDay: 10, status: 'scheduled' as const }
        await createCommissionApi('academy-demo', 'c1', input, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/courses/c1/commissions', { method: 'POST', body: JSON.stringify(input) })
    })
    it('patches a commission', async () => {
        const request = vi.fn().mockResolvedValue(apiCommission)
        await updateCommissionApi('academy-demo', 'c1', 'm1', { capacity: 30 }, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/courses/c1/commissions/m1', { method: 'PATCH', body: JSON.stringify({ capacity: 30 }) })
    })
    it('deletes a commission', async () => {
        const request = vi.fn().mockResolvedValue(undefined)
        await deleteCommissionApi('academy-demo', 'c1', 'm1', request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/courses/c1/commissions/m1', { method: 'DELETE' })
    })
    it('lists the roster of a commission', async () => {
        const member = { studentId: 's1', fullName: 'Lucía Gómez', email: '', phone: '', document: '32108901', status: 'active' as const, studentStatus: 'active' as const }
        const request = vi.fn().mockResolvedValue({ items: [member] })
        const roster = await fetchCommissionRoster('academy-demo', 'c1', 'm1', undefined, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/courses/c1/commissions/m1/students', expect.objectContaining({ signal: undefined }))
        expect(roster).toEqual([member])
    })
    it('assigns a student to a commission roster, with an optional status body', async () => {
        const request = vi.fn().mockResolvedValue(undefined)
        await assignEnrollmentApi('academy-demo', 'c1', 'm1', 's1', undefined, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/courses/c1/commissions/m1/students/s1', { method: 'PUT', body: undefined })
        await assignEnrollmentApi('academy-demo', 'c1', 'm1', 's1', 'paused', request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/courses/c1/commissions/m1/students/s1', { method: 'PUT', body: JSON.stringify({ status: 'paused' }) })
    })
    it('revokes a student from a commission roster', async () => {
        const request = vi.fn().mockResolvedValue(undefined)
        await revokeEnrollmentApi('academy-demo', 'c1', 'm1', 's1', request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/courses/c1/commissions/m1/students/s1', { method: 'DELETE' })
    })
    it('recognizes conflict error codes', () => {
        expect(isCommissionNameConflict(new ApiError(409, 'commission_name_conflict'))).toBe(true)
        expect(isCourseHasActiveCommissions(new ApiError(409, 'course_has_active_commissions'))).toBe(true)
        expect(isCommissionHasActiveRoster(new ApiError(409, 'commission_has_active_roster'))).toBe(true)
        expect(isCommissionNameConflict(new Error('boom'))).toBe(false)
    })
})
