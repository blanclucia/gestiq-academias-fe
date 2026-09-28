import { z } from 'zod'
import { authClient } from '@/auth/api/authClient'

const apiBranchSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    address: z.string(),
    openingTime: z.string(),
    closingTime: z.string(),
    operatingWeekdays: z.array(z.number()),
    status: z.enum(['active', 'inactive']),
})
const apiBranchListSchema = z.object({ items: z.array(apiBranchSchema) })

export type ApiBranch = z.infer<typeof apiBranchSchema>
export type ApiBranchInput = {
    displayCode: string
    name: string
    email: string
    phone: string
    address: string
    openingTime: string
    closingTime: string
    operatingWeekdays: number[]
    status: 'active' | 'inactive'
}
export type ApiBranchPatch = Partial<ApiBranchInput>
type Requester = (path: string, init?: RequestInit) => Promise<unknown>
const defaultRequest: Requester = (path, init) => authClient.authorizedRequest(path, init)

function branchesPath(organizationSlug: string, suffix = '') {
    return `/organizations/${organizationSlug}/branches${suffix}`
}

export async function fetchBranches(organizationSlug: string, signal?: AbortSignal, request: Requester = defaultRequest): Promise<ApiBranch[]> {
    const result = apiBranchListSchema.parse(await request(branchesPath(organizationSlug), { signal }))
    return result.items
}

export async function createBranchApi(organizationSlug: string, input: ApiBranchInput, request: Requester = defaultRequest): Promise<ApiBranch> {
    return apiBranchSchema.parse(await request(branchesPath(organizationSlug), { method: 'POST', body: JSON.stringify(input) }))
}

export async function updateBranchApi(organizationSlug: string, branchId: string, patch: ApiBranchPatch, request: Requester = defaultRequest): Promise<ApiBranch> {
    return apiBranchSchema.parse(await request(branchesPath(organizationSlug, `/${branchId}`), { method: 'PATCH', body: JSON.stringify(patch) }))
}

export async function assignBranchAdministratorApi(organizationSlug: string, branchId: string, userId: string, request: Requester = defaultRequest): Promise<void> {
    await request(branchesPath(organizationSlug, `/${branchId}/administrators/${userId}`), { method: 'PUT' })
}

export async function revokeBranchAdministratorApi(organizationSlug: string, branchId: string, userId: string, request: Requester = defaultRequest): Promise<void> {
    await request(branchesPath(organizationSlug, `/${branchId}/administrators/${userId}`), { method: 'DELETE' })
}

export async function assignBranchStaffApi(organizationSlug: string, branchId: string, userId: string, request: Requester = defaultRequest): Promise<void> {
    await request(branchesPath(organizationSlug, `/${branchId}/staff/${userId}`), { method: 'PUT' })
}

export async function revokeBranchStaffApi(organizationSlug: string, branchId: string, userId: string, request: Requester = defaultRequest): Promise<void> {
    await request(branchesPath(organizationSlug, `/${branchId}/staff/${userId}`), { method: 'DELETE' })
}
