import { z } from 'zod'
import { authClient } from '@/auth/api/authClient'
import { ApiError } from '@/services/http/client'

const apiCycleSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    name: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.enum(['draft', 'active', 'closed']),
    active: z.boolean(),
})
const apiCycleListSchema = z.object({ items: z.array(apiCycleSchema) })

const apiCommissionSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    courseId: z.string(),
    name: z.string(),
    teachers: z.array(z.string()),
    schedule: z.string(),
    capacity: z.number(),
    amount: z.number(),
    startDate: z.string(),
    endDate: z.string(),
    dueDay: z.number(),
    status: z.enum(['active', 'scheduled', 'closed']),
    studentsCount: z.number(),
})

const apiCourseSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    branchId: z.string(),
    cycleId: z.string(),
    name: z.string(),
    description: z.string(),
    status: z.enum(['active', 'draft', 'closed']),
    commissionsCount: z.number(),
    studentsCount: z.number(),
    commissions: z.array(apiCommissionSchema),
})
const apiCourseListSchema = z.object({ items: z.array(apiCourseSchema) })

const apiEnrollmentMemberSchema = z.object({
    studentId: z.string(),
    fullName: z.string(),
    email: z.string(),
    phone: z.string(),
    document: z.string(),
    status: z.enum(['active', 'paused', 'finished', 'dropped']),
    studentStatus: z.enum(['active', 'pending', 'inactive']),
})
const apiEnrollmentListSchema = z.object({ items: z.array(apiEnrollmentMemberSchema) })

export type ApiCycle = z.infer<typeof apiCycleSchema>
export type ApiCommission = z.infer<typeof apiCommissionSchema>
export type ApiCourse = z.infer<typeof apiCourseSchema>
export type ApiEnrollmentMember = z.infer<typeof apiEnrollmentMemberSchema>

export type ApiCycleInput = { name: string; startDate: string; endDate: string; status: 'draft' | 'active' | 'closed' }
export type ApiCourseInput = { branchId: string; cycleId: string; name: string; description: string; status: 'active' | 'draft' | 'closed' }
export type ApiCoursePatch = Partial<ApiCourseInput>
export type ApiCommissionInput = { name: string; teachers: string[]; schedule: string; capacity: number; amount: number; startDate: string; endDate: string; dueDay: number; status: 'active' | 'scheduled' | 'closed' }
export type ApiCommissionPatch = Partial<ApiCommissionInput>

type Requester = (path: string, init?: RequestInit) => Promise<unknown>
const defaultRequest: Requester = (path, init) => authClient.authorizedRequest(path, init)

function cyclesPath(organizationSlug: string, suffix = '') {
    return `/organizations/${organizationSlug}/academic-cycles${suffix}`
}
function coursesPath(organizationSlug: string, suffix = '') {
    return `/organizations/${organizationSlug}/courses${suffix}`
}

export async function fetchAcademicCycles(organizationSlug: string, signal?: AbortSignal, request: Requester = defaultRequest): Promise<ApiCycle[]> {
    return apiCycleListSchema.parse(await request(cyclesPath(organizationSlug), { signal })).items
}

export async function createAcademicCycleApi(organizationSlug: string, input: ApiCycleInput, request: Requester = defaultRequest): Promise<ApiCycle> {
    return apiCycleSchema.parse(await request(cyclesPath(organizationSlug), { method: 'POST', body: JSON.stringify(input) }))
}

export async function activateAcademicCycleApi(organizationSlug: string, cycleId: string, request: Requester = defaultRequest): Promise<void> {
    await request(cyclesPath(organizationSlug, `/${cycleId}/activate`), { method: 'PUT' })
}

export async function fetchCourses(organizationSlug: string, signal?: AbortSignal, request: Requester = defaultRequest): Promise<ApiCourse[]> {
    return apiCourseListSchema.parse(await request(coursesPath(organizationSlug), { signal })).items
}

export async function fetchCourse(organizationSlug: string, courseId: string, signal?: AbortSignal, request: Requester = defaultRequest): Promise<ApiCourse> {
    return apiCourseSchema.parse(await request(coursesPath(organizationSlug, `/${courseId}`), { signal }))
}

export async function createCourseApi(organizationSlug: string, input: ApiCourseInput, request: Requester = defaultRequest): Promise<ApiCourse> {
    return apiCourseSchema.parse(await request(coursesPath(organizationSlug), { method: 'POST', body: JSON.stringify(input) }))
}

export async function updateCourseApi(organizationSlug: string, courseId: string, patch: ApiCoursePatch, request: Requester = defaultRequest): Promise<ApiCourse> {
    return apiCourseSchema.parse(await request(coursesPath(organizationSlug, `/${courseId}`), { method: 'PATCH', body: JSON.stringify(patch) }))
}

export async function deleteCourseApi(organizationSlug: string, courseId: string, request: Requester = defaultRequest): Promise<void> {
    await request(coursesPath(organizationSlug, `/${courseId}`), { method: 'DELETE' })
}

export async function createCommissionApi(organizationSlug: string, courseId: string, input: ApiCommissionInput, request: Requester = defaultRequest): Promise<ApiCommission> {
    return apiCommissionSchema.parse(await request(coursesPath(organizationSlug, `/${courseId}/commissions`), { method: 'POST', body: JSON.stringify(input) }))
}

export async function updateCommissionApi(organizationSlug: string, courseId: string, commissionId: string, patch: ApiCommissionPatch, request: Requester = defaultRequest): Promise<ApiCommission> {
    return apiCommissionSchema.parse(await request(coursesPath(organizationSlug, `/${courseId}/commissions/${commissionId}`), { method: 'PATCH', body: JSON.stringify(patch) }))
}

export async function deleteCommissionApi(organizationSlug: string, courseId: string, commissionId: string, request: Requester = defaultRequest): Promise<void> {
    await request(coursesPath(organizationSlug, `/${courseId}/commissions/${commissionId}`), { method: 'DELETE' })
}

export async function fetchCommissionRoster(organizationSlug: string, courseId: string, commissionId: string, signal?: AbortSignal, request: Requester = defaultRequest): Promise<ApiEnrollmentMember[]> {
    return apiEnrollmentListSchema.parse(await request(coursesPath(organizationSlug, `/${courseId}/commissions/${commissionId}/students`), { signal })).items
}

export async function assignEnrollmentApi(organizationSlug: string, courseId: string, commissionId: string, studentId: string, status?: string, request: Requester = defaultRequest): Promise<void> {
    await request(coursesPath(organizationSlug, `/${courseId}/commissions/${commissionId}/students/${studentId}`), { method: 'PUT', body: status ? JSON.stringify({ status }) : undefined })
}

export async function revokeEnrollmentApi(organizationSlug: string, courseId: string, commissionId: string, studentId: string, request: Requester = defaultRequest): Promise<void> {
    await request(coursesPath(organizationSlug, `/${courseId}/commissions/${commissionId}/students/${studentId}`), { method: 'DELETE' })
}

export function isCommissionNameConflict(error: unknown): boolean {
    return error instanceof ApiError && error.code === 'commission_name_conflict'
}
export function isCourseHasActiveCommissions(error: unknown): boolean {
    return error instanceof ApiError && error.code === 'course_has_active_commissions'
}
export function isCommissionHasActiveRoster(error: unknown): boolean {
    return error instanceof ApiError && error.code === 'commission_has_active_roster'
}
export function isCourseClosed(error: unknown): boolean {
    return error instanceof ApiError && error.code === 'course_closed'
}
export function isCommissionClosed(error: unknown): boolean {
    return error instanceof ApiError && error.code === 'commission_closed'
}
export function isCommissionNoCapacity(error: unknown): boolean {
    return error instanceof ApiError && error.code === 'commission_no_capacity'
}

// Single source of truth for how an enrollment-assignment failure reads to the admin — every
// screen that assigns a student to a commission (Comisiones, Alumnos, importación CSV) should
// show the same wording instead of each one re-deriving its own phrasing from the error code.
export function describeEnrollmentFailure(error: unknown): string | undefined {
    if (isCourseClosed(error)) return 'El curso está cerrado: no admite inscripciones activas nuevas.'
    if (isCommissionClosed(error)) return 'La comisión está cerrada: no admite inscripciones activas nuevas.'
    if (isCommissionNoCapacity(error)) return 'La comisión ya alcanzó su cupo máximo.'
    return undefined
}
