import { z } from 'zod'
import { authClient } from '@/auth/api/authClient'
import { publicRequest } from '@/services/http/client'

const apiChargeSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    source: z.enum(['commission', 'manual']),
    studentId: z.string(),
    commissionId: z.string().optional(),
    concept: z.string(),
    amount: z.number(),
    dueDate: z.string(),
    status: z.enum(['pending', 'paid', 'under_review', 'rejected']),
    method: z.enum(['transfer', 'card', 'cash']).optional(),
    paidAt: z.string().optional(),
    paidAmount: z.number().optional(),
    notes: z.string(),
})
const apiChargeListSchema = z.object({ items: z.array(apiChargeSchema) })
const apiPublicChargeSchema = z.object({
    concept: z.string(),
    amount: z.number(),
    status: z.enum(['pending', 'paid', 'under_review', 'rejected']),
    studentName: z.string(),
})

export type ApiCharge = z.infer<typeof apiChargeSchema>
export type ApiPublicCharge = z.infer<typeof apiPublicChargeSchema>
export type ApiChargeInput = {
    studentId: string
    commissionId?: string
    concept: string
    amount: number
    dueDate: string
    status?: 'pending' | 'paid' | 'under_review' | 'rejected'
    method?: 'transfer' | 'card' | 'cash'
    paidAt?: string
    paidAmount?: number
    notes: string
}
export type ApiChargePatch = Partial<Omit<ApiChargeInput, 'studentId' | 'commissionId'>>
export type ApiChargeFilter = { studentId?: string; commissionId?: string; status?: string }
type Requester = (path: string, init?: RequestInit) => Promise<unknown>
const defaultRequest: Requester = (path, init) => authClient.authorizedRequest(path, init)
const defaultPublicRequest: Requester = (path, init) => publicRequest(path, init)

function chargesPath(organizationSlug: string, suffix = '') {
    return `/organizations/${organizationSlug}/charges${suffix}`
}
function publicChargesPath(organizationSlug: string, chargeId: string, suffix = '') {
    return `/public/organizations/${organizationSlug}/charges/${chargeId}${suffix}`
}

export async function fetchCharges(organizationSlug: string, filter: ApiChargeFilter = {}, signal?: AbortSignal, request: Requester = defaultRequest): Promise<ApiCharge[]> {
    const params = new URLSearchParams()
    if (filter.studentId) params.set('studentId', filter.studentId)
    if (filter.commissionId) params.set('commissionId', filter.commissionId)
    if (filter.status) params.set('status', filter.status)
    const query = params.toString()
    const result = apiChargeListSchema.parse(await request(chargesPath(organizationSlug, query ? `?${query}` : ''), { signal }))
    return result.items
}

export async function createChargeApi(organizationSlug: string, input: ApiChargeInput, request: Requester = defaultRequest): Promise<ApiCharge> {
    return apiChargeSchema.parse(await request(chargesPath(organizationSlug), { method: 'POST', body: JSON.stringify(input) }))
}

export async function updateChargeApi(organizationSlug: string, chargeId: string, patch: ApiChargePatch, request: Requester = defaultRequest): Promise<ApiCharge> {
    return apiChargeSchema.parse(await request(chargesPath(organizationSlug, `/${chargeId}`), { method: 'PATCH', body: JSON.stringify(patch) }))
}

export async function deleteChargeApi(organizationSlug: string, chargeId: string, request: Requester = defaultRequest): Promise<void> {
    await request(chargesPath(organizationSlug, `/${chargeId}`), { method: 'DELETE' })
}

export async function generateTuitionApi(organizationSlug: string, studentId: string, commissionId: string, request: Requester = defaultRequest): Promise<ApiCharge[]> {
    const result = apiChargeListSchema.parse(await request(chargesPath(organizationSlug, '/generate-tuition'), { method: 'POST', body: JSON.stringify({ studentId, commissionId }) }))
    return result.items
}

// Public, unauthenticated — generalizes the payment page to any charge shared by link (inscription
// fees included), not just cuotas managed from Facturación.
export async function fetchPublicCharge(organizationSlug: string, chargeId: string, signal?: AbortSignal, request: Requester = defaultPublicRequest): Promise<ApiPublicCharge> {
    return apiPublicChargeSchema.parse(await request(publicChargesPath(organizationSlug, chargeId), { signal }))
}
export async function payPublicChargeApi(organizationSlug: string, chargeId: string, request: Requester = defaultPublicRequest): Promise<ApiCharge> {
    return apiChargeSchema.parse(await request(publicChargesPath(organizationSlug, chargeId, '/pay'), { method: 'POST' }))
}
export async function reportPublicChargeTransferApi(organizationSlug: string, chargeId: string, request: Requester = defaultPublicRequest): Promise<ApiCharge> {
    return apiChargeSchema.parse(await request(publicChargesPath(organizationSlug, chargeId, '/report-transfer'), { method: 'POST' }))
}
