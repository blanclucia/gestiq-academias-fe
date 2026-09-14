import { defaultAcademyBrand, type AcademyBrand } from '@/theme/brandTheme'
import { readOrganizationStorageItem, writeOrganizationStorageItem } from '@/workspace/organizationScope'

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
    receiptPrefix: string
}

export type AcademyEnrollmentSettings = {
    confirmationMode: 'Automática' | 'Manual'
    reservationHours: number
    defaultCapacity: number
    requirePayment: boolean
    requiredFields: string[]
    terms: string
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
        receiptPrefix: 'AP',
    },
    enrollments: {
        confirmationMode: 'Manual',
        reservationHours: 48,
        defaultCapacity: 20,
        requirePayment: false,
        requiredFields: ['Documento', 'Email', 'Teléfono', 'Fecha de nacimiento'],
        terms: 'Declaro que los datos ingresados son correctos y acepto las condiciones de inscripción.',
    },
}

export function getAcademySettings(): AcademySettings {
    if (typeof window === 'undefined') return defaultAcademySettings
    try {
        const stored = JSON.parse(readOrganizationStorageItem(storageKey) ?? 'null') as Partial<AcademySettings> | null
        if (!stored) return defaultAcademySettings
        const legacyPayments = stored.payments as (Partial<AcademyPaymentSettings> & { bankAccount?: string }) | undefined
        const legacyAlias = legacyPayments?.bankAccount?.replace(/^Alias:\s*/i, '') ?? ''
        return {
            general: { ...defaultAcademySettings.general, ...stored.general },
            brand: { ...defaultAcademySettings.brand, ...stored.brand },
            payments: {
                ...defaultAcademySettings.payments,
                ...legacyPayments,
                transferAlias: legacyPayments?.transferAlias ?? (legacyAlias || defaultAcademySettings.payments.transferAlias),
            },
            enrollments: { ...defaultAcademySettings.enrollments, ...stored.enrollments },
        }
    } catch {
        return defaultAcademySettings
    }
}

export function saveAcademySettings(settings: AcademySettings) {
    writeOrganizationStorageItem(storageKey, JSON.stringify(settings))
}
