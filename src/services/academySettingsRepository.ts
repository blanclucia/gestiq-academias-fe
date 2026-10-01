import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/AuthContext'
import { defaultAcademyBrand, type AcademyBrand } from '@/theme/brandTheme'
import { readOrganizationStorageItem, writeOrganizationStorageItem } from '@/workspace/organizationScope'
import { fetchOrganizationSettings, updateOrganizationSettings, type ApiSettings, type ApiSettingsPatch } from '@/services/organization/settingsApi'
import { confirmationModeFromApi, confirmationModeToApi, orgStatusFromApi, orgStatusToApi, paymentMethodsFromApi, paymentMethodsToApi, requiredFieldsFromApi, requiredFieldsToApi } from '@/services/organization/settingsMapping'

export type AcademyGeneralSettings = {
    commercialName: string
    legalName: string
    taxId: string
    email: string
    phone: string
    website: string
    address: string
    timezone: string
    currency: string
    status: 'Activa' | 'Inactiva'
}

export type AcademyPaymentSettings = {
    defaultDueDay: number
    graceDays: number
    lateFeePercent: number
    enabledMethods: string[]
    transferAlias: string
    transferCbu: string
    accountHolder: string
    accountTaxId: string
    paymentMessage: string
    paymentLink: string
}

export type AcademyEnrollmentSettings = {
    confirmationMode: 'Automática' | 'Manual'
    defaultCapacity: number
    requirePayment: boolean
    requiredFields: string[]
}

export type AcademySettings = {
    general: AcademyGeneralSettings
    brand: AcademyBrand
    payments: AcademyPaymentSettings
    enrollments: AcademyEnrollmentSettings
}

const storageKey = 'gestiq-academy-settings-v1'

export const defaultAcademySettings: AcademySettings = {
    general: {
        commercialName: defaultAcademyBrand.name,
        legalName: 'Academia Puentes SAS',
        taxId: '30-71234567-8',
        email: 'hola@academiapuentes.com',
        phone: '+54 351 555-0198',
        website: 'https://academiapuentes.com',
        address: 'Av. San Martín 1240, Córdoba',
        timezone: 'America/Argentina/Cordoba',
        currency: 'ARS',
        status: 'Activa',
    },
    brand: defaultAcademyBrand,
    payments: {
        defaultDueDay: 10,
        graceDays: 5,
        lateFeePercent: 0,
        enabledMethods: ['Transferencia', 'Efectivo', 'Mercado Pago'],
        transferAlias: 'ACADEMIA.PUENTES',
        transferCbu: '',
        accountHolder: 'Academia Puentes SAS',
        accountTaxId: '30-71234567-8',
        paymentMessage: 'Te compartimos el enlace para abonar tu cuota. Gracias.',
        paymentLink: 'https://mpago.la/demo-academia-puentes',
    },
    enrollments: {
        confirmationMode: 'Manual',
        defaultCapacity: 20,
        requirePayment: false,
        requiredFields: ['Documento', 'Email', 'Teléfono', 'Fecha de nacimiento'],
    },
}

// Public pages read real settings via usePublicEnrollmentSettings() now — this local mirror only
// survives to carry logoDataUrl (no real logo upload endpoint yet, see fromApi() below).
export function getAcademySettings(): AcademySettings {
    if (typeof window === 'undefined') return defaultAcademySettings
    try {
        const stored = JSON.parse(readOrganizationStorageItem(storageKey) ?? 'null') as Partial<AcademySettings> | null
        if (!stored) return defaultAcademySettings
        return {
            general: { ...defaultAcademySettings.general, ...stored.general },
            brand: { ...defaultAcademySettings.brand, ...stored.brand },
            payments: { ...defaultAcademySettings.payments, ...stored.payments },
            enrollments: { ...defaultAcademySettings.enrollments, ...stored.enrollments },
        }
    } catch {
        return defaultAcademySettings
    }
}

function saveLocalMirror(settings: AcademySettings) {
    writeOrganizationStorageItem(storageKey, JSON.stringify(settings))
}

function fromApi(settings: ApiSettings): AcademySettings {
    return {
        general: { ...settings.general, status: orgStatusFromApi(settings.general.status) },
        brand: {
            name: settings.brand.name, shortName: settings.brand.shortName || undefined,
            primary: settings.brand.primary, primaryStrong: settings.brand.primaryStrong, primarySoft: settings.brand.primarySoft,
            primaryContrast: settings.brand.primaryContrast, accent: settings.brand.accent || undefined,
            logoDataUrl: getAcademySettings().brand.logoDataUrl,
        },
        payments: { ...settings.payments, enabledMethods: paymentMethodsFromApi(settings.payments.enabledMethods) },
        enrollments: {
            ...settings.enrollments,
            confirmationMode: confirmationModeFromApi(settings.enrollments.confirmationMode),
            requiredFields: requiredFieldsFromApi(settings.enrollments.requiredFields),
        },
    }
}

function toApiPatch(settings: AcademySettings): ApiSettingsPatch {
    return {
        general: { ...settings.general, status: orgStatusToApi(settings.general.status) },
        brand: {
            name: settings.brand.name, shortName: settings.brand.shortName ?? '',
            primary: settings.brand.primary, primaryStrong: settings.brand.primaryStrong, primarySoft: settings.brand.primarySoft,
            primaryContrast: settings.brand.primaryContrast, accent: settings.brand.accent ?? '',
        },
        payments: { ...settings.payments, enabledMethods: paymentMethodsToApi(settings.payments.enabledMethods) },
        enrollments: {
            ...settings.enrollments,
            confirmationMode: confirmationModeToApi(settings.enrollments.confirmationMode),
            requiredFields: requiredFieldsToApi(settings.enrollments.requiredFields),
        },
    }
}

export function useAcademySettings(options: { enabled?: boolean } = {}) {
    const { session } = useAuth()
    const organizationSlug = session?.organization.slug
    const query = useQuery({
        queryKey: ['academy-settings', organizationSlug],
        queryFn: async ({ signal }) => fromApi(await fetchOrganizationSettings(organizationSlug!, signal)),
        enabled: Boolean(organizationSlug) && (options.enabled ?? true),
    })
    return { settings: query.data, isLoading: query.isLoading, isError: query.isError, error: query.error }
}

export function useSaveAcademySettings() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async (settings: AcademySettings) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            const updated = fromApi(await updateOrganizationSettings(organizationSlug, toApiPatch(settings)))
            const merged: AcademySettings = { ...updated, brand: { ...updated.brand, logoDataUrl: settings.brand.logoDataUrl } }
            saveLocalMirror(merged)
            return merged
        },
        onSuccess: (settings) => queryClient.setQueryData(['academy-settings', organizationSlug], settings),
    })
}
