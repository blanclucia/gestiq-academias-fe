import { describe, expect, it, vi } from 'vitest'
import { fetchOrganizationSettings, updateOrganizationSettings } from './settingsApi'

const apiSettings = {
    general: { commercialName: 'Academia Puentes', legalName: 'Academia Puentes SAS', taxId: '30-1', email: 'a@a.com', phone: '', website: '', address: '', timezone: 'America/Argentina/Cordoba', currency: 'ARS', status: 'active' as const },
    brand: { name: 'Academia Puentes', shortName: 'AP', logoUrl: '', primary: '#4f46e5', primaryStrong: '#3730a3', primarySoft: 'rgba(0,0,0,0.1)', primaryContrast: '#ffffff', accent: '#22c55e' },
    payments: { defaultDueDay: 10, graceDays: 5, lateFeePercent: 0, transferAlias: '', transferCbu: '', accountHolder: '', accountTaxId: '', paymentMessage: '', paymentLink: '', receiptPrefix: 'AP', enabledMethods: ['bank_transfer'] },
    enrollments: { confirmationMode: 'manual' as const, reservationHours: 48, defaultCapacity: 20, requirePayment: false, requiredFields: ['document'], terms: '' },
}

describe('organization settings API client', () => {
    it('fetches settings for an organization', async () => {
        const request = vi.fn().mockResolvedValue(apiSettings)
        const settings = await fetchOrganizationSettings('academy-demo', undefined, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/settings', expect.objectContaining({ signal: undefined }))
        expect(settings).toEqual(apiSettings)
    })
    it('patches only the given sections', async () => {
        const request = vi.fn().mockResolvedValue(apiSettings)
        await updateOrganizationSettings('academy-demo', { general: { commercialName: 'Nuevo nombre' } }, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/settings', { method: 'PATCH', body: JSON.stringify({ general: { commercialName: 'Nuevo nombre' } }) })
    })
    it('rejects a malformed response instead of returning bad data', async () => {
        const request = vi.fn().mockResolvedValue({ ...apiSettings, enrollments: { ...apiSettings.enrollments, confirmationMode: 'sometimes' } })
        await expect(fetchOrganizationSettings('academy-demo', undefined, request)).rejects.toThrow()
    })
})
