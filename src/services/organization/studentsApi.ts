import { z } from 'zod'
import { authClient } from '@/auth/api/authClient'
import { ApiError } from '@/services/http/client'

const apiStudentSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    branchId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    fullName: z.string(),
    document: z.string(),
    email: z.string(),
    phone: z.string(),
    birthDate: z.string(),
    tutorName: z.string(),
    tutorEmail: z.string(),
    tutorPhone: z.string(),
    notes: z.string(),
    status: z.enum(['active', 'pending', 'inactive']),
})
const apiStudentListSchema = z.object({ items: z.array(apiStudentSchema) })
const apiStudentEnrollmentSchema = z.object({
    courseId: z.string(),
    courseName: z.string(),
    commissionId: z.string(),
    commissionName: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.enum(['active', 'paused', 'finished', 'dropped']),
    enrolledAt: z.string(),
})
const apiStudentEnrollmentListSchema = z.object({ items: z.array(apiStudentEnrollmentSchema) })
export type ApiStudentEnrollment = z.infer<typeof apiStudentEnrollmentSchema>

export type ApiStudent = z.infer<typeof apiStudentSchema>
export type ApiStudentInput = {
    branchId: string
    firstName: string
    lastName: string
    document: string
    email: string
    phone: string
    birthDate: string
    notes: string
    status: 'active' | 'pending' | 'inactive'
}
export type ApiStudentPatch = Partial<ApiStudentInput>
type Requester = (path: string, init?: RequestInit) => Promise<unknown>
const defaultRequest: Requester = (path, init) => authClient.authorizedRequest(path, init)

function studentsPath(organizationSlug: string, suffix = '') {
    return `/organizations/${organizationSlug}/students${suffix}`
}

export async function fetchStudents(organizationSlug: string, signal?: AbortSignal, request: Requester = defaultRequest): Promise<ApiStudent[]> {
    const result = apiStudentListSchema.parse(await request(studentsPath(organizationSlug), { signal }))
    return result.items
}

export async function createStudentApi(organizationSlug: string, input: ApiStudentInput, request: Requester = defaultRequest): Promise<ApiStudent> {
    return apiStudentSchema.parse(await request(studentsPath(organizationSlug), { method: 'POST', body: JSON.stringify(input) }))
}

export async function updateStudentApi(organizationSlug: string, studentId: string, patch: ApiStudentPatch, request: Requester = defaultRequest): Promise<ApiStudent> {
    return apiStudentSchema.parse(await request(studentsPath(organizationSlug, `/${studentId}`), { method: 'PATCH', body: JSON.stringify(patch) }))
}

export async function deleteStudentApi(organizationSlug: string, studentId: string, request: Requester = defaultRequest): Promise<void> {
    await request(studentsPath(organizationSlug, `/${studentId}`), { method: 'DELETE' })
}

export function isStudentDocumentConflict(error: unknown): boolean {
    return error instanceof ApiError && error.code === 'student_document_conflict'
}

export async function fetchStudentEnrollments(organizationSlug: string, studentId: string, signal?: AbortSignal, request: Requester = defaultRequest): Promise<ApiStudentEnrollment[]> {
    const result = apiStudentEnrollmentListSchema.parse(await request(studentsPath(organizationSlug, `/${studentId}/enrollments`), { signal }))
    return result.items
}
