import { z } from 'zod'
import { authClient } from '@/auth/api/authClient'
import { ApiError } from '@/services/http/client'

const apiMemberSchema = z.object({
    userId: z.string(),
    name: z.string(),
    email: z.string(),
    dni: z.string(),
    roles: z.array(z.string()),
    administrativeLevel: z.string().optional(),
    status: z.string(),
})

export type ApiMember = z.infer<typeof apiMemberSchema>
export type ApiMemberInput = { dni: string; name: string; email: string; roles: string[] }
type Requester = (path: string, init?: RequestInit) => Promise<unknown>
const defaultRequest: Requester = (path, init) => authClient.authorizedRequest(path, init)

function membersPath(organizationSlug: string, suffix = '') {
    return `/organizations/${organizationSlug}/members${suffix}`
}

export async function createMemberApi(organizationSlug: string, input: ApiMemberInput, request: Requester = defaultRequest): Promise<ApiMember> {
    return apiMemberSchema.parse(await request(membersPath(organizationSlug), { method: 'POST', body: JSON.stringify(input) }))
}

export async function grantMemberRoleApi(organizationSlug: string, userId: string, role: string, request: Requester = defaultRequest): Promise<void> {
    await request(membersPath(organizationSlug, `/${userId}/roles/${role}`), { method: 'PUT' })
}

export async function revokeMemberRoleApi(organizationSlug: string, userId: string, role: string, request: Requester = defaultRequest): Promise<void> {
    await request(membersPath(organizationSlug, `/${userId}/roles/${role}`), { method: 'DELETE' })
}

export function isMemberConflict(error: unknown): boolean {
    return error instanceof ApiError && error.code === 'member_already_exists'
}

export function administersBranches(error: unknown): boolean {
    return error instanceof ApiError && error.code === 'member_administers_branches'
}
