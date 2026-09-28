import { z } from 'zod'
import { authClient } from '@/auth/api/authClient'
import { publicRequest } from '@/services/http/client'

const apiOpeningSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    slug: z.string(),
    courseId: z.string(),
    commissionIds: z.array(z.string()),
    amount: z.number(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.enum(['open', 'scheduled', 'closed']),
    registrationsCount: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
})
const apiOpeningListSchema = z.object({ items: z.array(apiOpeningSchema) })

const apiRegistrationSummarySchema = z.object({
    id: z.string(),
    studentId: z.string(),
    studentFullName: z.string(),
    studentEmail: z.string(),
    studentPhone: z.string(),
    commissionId: z.string(),
    commissionName: z.string(),
    chargeId: z.string(),
    chargeStatus: z.enum(['pending', 'paid', 'under_review', 'rejected']),
    chargeAmount: z.number(),
    rosterConfirmed: z.boolean(),
    adminNotes: z.string(),
    createdAt: z.string(),
})
const apiRegistrationListSchema = z.object({ items: z.array(apiRegistrationSummarySchema) })

const apiPublicEligibleCommissionSchema = z.object({
    id: z.string(),
    name: z.string(),
    schedule: z.string(),
    amount: z.number(),
    capacity: z.number(),
    occupied: z.number(),
    startDate: z.string(),
    endDate: z.string(),
})
const apiPublicOfferSchema = z.object({
    openingId: z.string(),
    slug: z.string(),
    courseId: z.string(),
    courseName: z.string(),
    amount: z.number(),
    status: z.enum(['open', 'scheduled', 'closed']),
    startDate: z.string(),
    endDate: z.string(),
    commissions: z.array(apiPublicEligibleCommissionSchema),
})

const apiPublicRegistrationResultSchema = z.object({
    id: z.string(),
    fullName: z.string(),
    chargeId: z.string(),
    amount: z.number(),
})

export type ApiOpening = z.infer<typeof apiOpeningSchema>
export type ApiRegistrationSummary = z.infer<typeof apiRegistrationSummarySchema>
export type ApiPublicEligibleCommission = z.infer<typeof apiPublicEligibleCommissionSchema>
export type ApiPublicOffer = z.infer<typeof apiPublicOfferSchema>
export type ApiPublicRegistrationResult = z.infer<typeof apiPublicRegistrationResultSchema>

export type ApiOpeningCreate = {
    courseId: string
    commissionIds?: string[]
    amount: number
    startDate: string
    endDate: string
    status?: 'open' | 'scheduled' | 'closed'
}
export type ApiOpeningPatch = Partial<Omit<ApiOpeningCreate, 'courseId'>>
export type ApiPublicRegistrationInput = {
    commissionId: string
    firstName: string
    lastName: string
    document: string
    email?: string
    phone?: string
    birthDate?: string
    address?: string
    tutorName?: string
    tutorEmail?: string
    tutorPhone?: string
    priorStudies?: string
}

type Requester = (path: string, init?: RequestInit) => Promise<unknown>
const defaultRequest: Requester = (path, init) => authClient.authorizedRequest(path, init)
const defaultPublicRequest: Requester = (path, init) => publicRequest(path, init)

function openingsPath(organizationSlug: string, suffix = '') {
    return `/organizations/${organizationSlug}/enrollment-openings${suffix}`
}
function registrationsPath(organizationSlug: string, suffix = '') {
    return `/organizations/${organizationSlug}/enrollment-registrations${suffix}`
}
function publicOfferPath(organizationSlug: string, slug: string, suffix = '') {
    return `/public/organizations/${organizationSlug}/enrollment-offers/${slug}${suffix}`
}

export async function fetchEnrollmentOpenings(organizationSlug: string, filter: { courseId?: string } = {}, signal?: AbortSignal, request: Requester = defaultRequest): Promise<ApiOpening[]> {
    const params = new URLSearchParams()
    if (filter.courseId) params.set('courseId', filter.courseId)
    const query = params.toString()
    const result = apiOpeningListSchema.parse(await request(openingsPath(organizationSlug, query ? `?${query}` : ''), { signal }))
    return result.items
}
export async function createEnrollmentOpeningApi(organizationSlug: string, input: ApiOpeningCreate, request: Requester = defaultRequest): Promise<ApiOpening> {
    return apiOpeningSchema.parse(await request(openingsPath(organizationSlug), { method: 'POST', body: JSON.stringify(input) }))
}
export async function updateEnrollmentOpeningApi(organizationSlug: string, openingId: string, patch: ApiOpeningPatch, request: Requester = defaultRequest): Promise<ApiOpening> {
    return apiOpeningSchema.parse(await request(openingsPath(organizationSlug, `/${openingId}`), { method: 'PATCH', body: JSON.stringify(patch) }))
}
export async function deleteEnrollmentOpeningApi(organizationSlug: string, openingId: string, request: Requester = defaultRequest): Promise<void> {
    await request(openingsPath(organizationSlug, `/${openingId}`), { method: 'DELETE' })
}
export async function fetchEnrollmentRegistrations(organizationSlug: string, openingId: string, signal?: AbortSignal, request: Requester = defaultRequest): Promise<ApiRegistrationSummary[]> {
    const result = apiRegistrationListSchema.parse(await request(openingsPath(organizationSlug, `/${openingId}/registrations`), { signal }))
    return result.items
}
export async function updateRegistrationNotesApi(organizationSlug: string, registrationId: string, adminNotes: string, request: Requester = defaultRequest): Promise<ApiRegistrationSummary> {
    return apiRegistrationSummarySchema.parse(await request(registrationsPath(organizationSlug, `/${registrationId}`), { method: 'PATCH', body: JSON.stringify({ adminNotes }) }))
}
export async function confirmRegistrationApi(organizationSlug: string, registrationId: string, request: Requester = defaultRequest): Promise<ApiRegistrationSummary> {
    return apiRegistrationSummarySchema.parse(await request(registrationsPath(organizationSlug, `/${registrationId}/confirm`), { method: 'POST' }))
}

export async function fetchPublicOffer(organizationSlug: string, slug: string, signal?: AbortSignal, request: Requester = defaultPublicRequest): Promise<ApiPublicOffer> {
    return apiPublicOfferSchema.parse(await request(publicOfferPath(organizationSlug, slug), { signal }))
}
export async function registerPubliclyApi(organizationSlug: string, slug: string, input: ApiPublicRegistrationInput, request: Requester = defaultPublicRequest): Promise<ApiPublicRegistrationResult> {
    return apiPublicRegistrationResultSchema.parse(await request(publicOfferPath(organizationSlug, slug, '/registrations'), { method: 'POST', body: JSON.stringify(input) }))
}
