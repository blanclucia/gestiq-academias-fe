import { z } from 'zod'
import { authClient } from '@/auth/api/authClient'
import { ApiError } from '@/services/http/client'

const apiStaffSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    fullName: z.string(),
    email: z.string(),
    phone: z.string(),
    specialty: z.string(),
    dni: z.string(),
    role: z.enum(['teacher', 'administrative']),
    status: z.enum(['active', 'inactive']),
    userId: z.string().optional(),
})
const apiStaffListSchema = z.object({ items: z.array(apiStaffSchema) })

export type ApiStaff = z.infer<typeof apiStaffSchema>
export type ApiStaffInput = {
    firstName: string
    lastName: string
    email: string
    phone: string
    specialty: string
    dni: string
    role: 'teacher' | 'administrative'
    status: 'active' | 'inactive'
    userId?: string
}
export type ApiStaffPatch = Partial<ApiStaffInput>
type Requester = (path: string, init?: RequestInit) => Promise<unknown>
const defaultRequest: Requester = (path, init) => authClient.authorizedRequest(path, init)

function staffPath(organizationSlug: string, suffix = '') {
    return `/organizations/${organizationSlug}/staff${suffix}`
}

export async function fetchStaff(organizationSlug: string, signal?: AbortSignal, request: Requester = defaultRequest): Promise<ApiStaff[]> {
    const result = apiStaffListSchema.parse(await request(staffPath(organizationSlug), { signal }))
    return result.items
}

export async function createStaffApi(organizationSlug: string, input: ApiStaffInput, request: Requester = defaultRequest): Promise<ApiStaff> {
    return apiStaffSchema.parse(await request(staffPath(organizationSlug), { method: 'POST', body: JSON.stringify(input) }))
}

export async function updateStaffApi(organizationSlug: string, staffId: string, patch: ApiStaffPatch, request: Requester = defaultRequest): Promise<ApiStaff> {
    return apiStaffSchema.parse(await request(staffPath(organizationSlug, `/${staffId}`), { method: 'PATCH', body: JSON.stringify(patch) }))
}

export async function deleteStaffApi(organizationSlug: string, staffId: string, request: Requester = defaultRequest): Promise<void> {
    await request(staffPath(organizationSlug, `/${staffId}`), { method: 'DELETE' })
}

export function isStaffDniConflict(error: unknown): boolean {
    return error instanceof ApiError && error.code === 'staff_dni_conflict'
}
