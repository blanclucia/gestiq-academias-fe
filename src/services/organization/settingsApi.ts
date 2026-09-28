import { z } from 'zod'
import { authClient } from '@/auth/api/authClient'

const generalSchema = z.object({
    commercialName: z.string(), legalName: z.string(), taxId: z.string(), email: z.string(), phone: z.string(),
    website: z.string(), address: z.string(), timezone: z.string(), currency: z.string(), status: z.enum(['active', 'inactive']),
})
const brandSchema = z.object({
    name: z.string(), shortName: z.string(), logoUrl: z.string(),
    primary: z.string(), primaryStrong: z.string(), primarySoft: z.string(), primaryContrast: z.string(), accent: z.string(),
})
const paymentsSchema = z.object({
    defaultDueDay: z.number(), graceDays: z.number(), lateFeePercent: z.number(),
    transferAlias: z.string(), transferCbu: z.string(), accountHolder: z.string(), accountTaxId: z.string(),
    paymentMessage: z.string(), paymentLink: z.string(), receiptPrefix: z.string(), enabledMethods: z.array(z.string()),
})
const enrollmentsSchema = z.object({
    confirmationMode: z.enum(['manual', 'automatic']), reservationHours: z.number(), defaultCapacity: z.number(),
    requirePayment: z.boolean(), requiredFields: z.array(z.string()), terms: z.string(),
})
const apiSettingsSchema = z.object({ general: generalSchema, brand: brandSchema, payments: paymentsSchema, enrollments: enrollmentsSchema })

export type ApiSettings = z.infer<typeof apiSettingsSchema>
export type ApiSettingsPatch = Partial<{
    general: Partial<ApiSettings['general']>
    brand: Partial<Omit<ApiSettings['brand'], 'logoUrl'>>
    payments: Partial<ApiSettings['payments']>
    enrollments: Partial<ApiSettings['enrollments']>
}>
type Requester = (path: string, init?: RequestInit) => Promise<unknown>
const defaultRequest: Requester = (path, init) => authClient.authorizedRequest(path, init)

function settingsPath(organizationSlug: string) {
    return `/organizations/${organizationSlug}/settings`
}

export async function fetchOrganizationSettings(organizationSlug: string, signal?: AbortSignal, request: Requester = defaultRequest): Promise<ApiSettings> {
    return apiSettingsSchema.parse(await request(settingsPath(organizationSlug), { signal }))
}

export async function updateOrganizationSettings(organizationSlug: string, patch: ApiSettingsPatch, request: Requester = defaultRequest): Promise<ApiSettings> {
    return apiSettingsSchema.parse(await request(settingsPath(organizationSlug), { method: 'PATCH', body: JSON.stringify(patch) }))
}
