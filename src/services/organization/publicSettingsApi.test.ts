import { describe, expect, it, vi } from 'vitest'
import { fetchPublicEnrollmentSettings } from './publicSettingsApi'

const apiSettings = {
    brand: { name: 'Academy Demo', shortName: 'AD', logoUrl: '', primary: '#4f46e5', primaryStrong: '#3730a3', primarySoft: '#eef2ff', primaryContrast: '#ffffff', accent: '#22c55e' },
    general: { commercialName: 'Academy Demo', address: 'Av. Siempre Viva 123' },
    payments: { enabledMethods: ['bank_transfer', 'cash'], paymentMessage: 'Gracias', paymentLink: '', transferAlias: 'ACADEMY', transferCbu: '', accountHolder: 'Academy SAS', accountTaxId: '30-1-8' },
    enrollments: { confirmationMode: 'manual' as const, requirePayment: false, requiredFields: ['document', 'email'] },
}

describe('public enrollment settings API client', () => {
    it('fetches the curated public settings for an organization', async () => {
        const request = vi.fn().mockResolvedValue(apiSettings)
        const settings = await fetchPublicEnrollmentSettings('academy-demo', undefined, request)
        expect(request).toHaveBeenCalledWith('/public/organizations/academy-demo/enrollment-settings', expect.objectContaining({ signal: undefined }))
        expect(settings).toEqual(apiSettings)
    })
    it('rejects a malformed response instead of returning bad data', async () => {
        const request = vi.fn().mockResolvedValue({ ...apiSettings, enrollments: { ...apiSettings.enrollments, confirmationMode: 'invalid' } })
        await expect(fetchPublicEnrollmentSettings('academy-demo', undefined, request)).rejects.toThrow()
    })
})
