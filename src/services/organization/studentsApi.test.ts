import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/services/http/client'
import { createStudentApi, deleteStudentApi, fetchStudents, isStudentDocumentConflict, updateStudentApi } from './studentsApi'

const apiStudent = {
    id: 's1', organizationId: 'org1', branchId: 'b1', firstName: 'Lucía', lastName: 'Gómez', fullName: 'Lucía Gómez',
    document: '32108901', email: 'lucia@example.com', phone: '', birthDate: '', tutorName: '', tutorEmail: '', tutorPhone: '', notes: '',
    status: 'active' as const,
}

describe('students API client', () => {
    it('lists students for an organization', async () => {
        const request = vi.fn().mockResolvedValue({ items: [apiStudent] })
        const students = await fetchStudents('academy-demo', undefined, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/students', expect.objectContaining({ signal: undefined }))
        expect(students).toEqual([apiStudent])
    })
    it('creates a student with the given payload', async () => {
        const request = vi.fn().mockResolvedValue(apiStudent)
        const input = { branchId: 'b1', firstName: 'Lucía', lastName: 'Gómez', document: '32108901', email: 'lucia@example.com', phone: '', birthDate: '', notes: '', status: 'active' as const }
        const created = await createStudentApi('academy-demo', input, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/students', { method: 'POST', body: JSON.stringify(input) })
        expect(created).toEqual(apiStudent)
    })
    it('patches only the given student fields', async () => {
        const request = vi.fn().mockResolvedValue(apiStudent)
        await updateStudentApi('academy-demo', 's1', { status: 'inactive' }, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/students/s1', { method: 'PATCH', body: JSON.stringify({ status: 'inactive' }) })
    })
    it('deletes a student with no body', async () => {
        const request = vi.fn().mockResolvedValue(undefined)
        await deleteStudentApi('academy-demo', 's1', request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/students/s1', { method: 'DELETE' })
    })
    it('rejects a malformed response instead of returning bad data', async () => {
        const request = vi.fn().mockResolvedValue({ items: [{ ...apiStudent, status: 'graduated' }] })
        await expect(fetchStudents('academy-demo', undefined, request)).rejects.toThrow()
    })
    it('recognizes a document conflict error', () => {
        expect(isStudentDocumentConflict(new ApiError(409, 'student_document_conflict'))).toBe(true)
        expect(isStudentDocumentConflict(new ApiError(409, 'other_conflict'))).toBe(false)
        expect(isStudentDocumentConflict(new Error('boom'))).toBe(false)
    })
})
