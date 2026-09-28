import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { publicRequest } from '@/services/http/client'

const brandSchema = z.object({
    name: z.string(), shortName: z.string(), logoUrl: z.string(),
    primary: z.string(), primaryStrong: z.string(), primarySoft: z.string(), primaryContrast: z.string(), accent: z.string(),
})
const apiPublicEnrollmentSettingsSchema = z.object({
    brand: brandSchema,
    general: z.object({ commercialName: z.string(), address: z.string() }),
    payments: z.object({
        enabledMethods: z.array(z.string()), paymentMessage: z.string(), paymentLink: z.string(),
        transferAlias: z.string(), transferCbu: z.string(), accountHolder: z.string(), accountTaxId: z.string(),
    }),
    enrollments: z.object({
        confirmationMode: z.enum(['manual', 'automatic']), requirePayment: z.boolean(), requiredFields: z.array(z.string()),
    }),
})

export type ApiPublicEnrollmentSettings = z.infer<typeof apiPublicEnrollmentSettingsSchema>

type Requester = (path: string, init?: RequestInit) => Promise<unknown>
const defaultRequest: Requester = (path, init) => publicRequest(path, init)

export async function fetchPublicEnrollmentSettings(organizationSlug: string, signal?: AbortSignal, request: Requester = defaultRequest): Promise<ApiPublicEnrollmentSettings> {
    return apiPublicEnrollmentSettingsSchema.parse(await request(`/public/organizations/${organizationSlug}/enrollment-settings`, { signal }))
}

// No hay sesión en las páginas que usan esto (inscripción/pago públicos) — sin useAuth, mismo
// patrón que LoginPage.tsx para /public/.../context.
export function usePublicEnrollmentSettings(organizationSlug: string | undefined) {
    return useQuery({
        queryKey: ['public-enrollment-settings', organizationSlug],
        queryFn: ({ signal }) => fetchPublicEnrollmentSettings(organizationSlug!, signal),
        enabled: Boolean(organizationSlug),
        retry: false,
    })
}
