import { describe, expect, it } from 'vitest'
import {
    confirmationModeFromApi, confirmationModeToApi,
    orgStatusFromApi, orgStatusToApi,
    paymentMethodsFromApi, paymentMethodsToApi,
    requiredFieldsFromApi, requiredFieldsToApi,
} from './settingsMapping'

describe('organization settings enum mapping', () => {
    it('maps status both ways', () => {
        expect(orgStatusToApi('Activa')).toBe('active')
        expect(orgStatusFromApi('active')).toBe('Activa')
    })
    it('maps confirmation mode both ways', () => {
        expect(confirmationModeToApi('Automática')).toBe('automatic')
        expect(confirmationModeToApi('Manual')).toBe('manual')
        expect(confirmationModeFromApi('automatic')).toBe('Automática')
        expect(confirmationModeFromApi('manual')).toBe('Manual')
    })
    it('maps every UI payment method to a known backend value and back', () => {
        const methods = ['Transferencia', 'Efectivo', 'Tarjeta', 'Mercado Pago']
        const apiMethods = paymentMethodsToApi(methods)
        expect(apiMethods).toEqual(['bank_transfer', 'cash', 'card', 'mercado_pago'])
        expect(paymentMethodsFromApi(apiMethods)).toEqual(methods)
    })
    it('drops payment methods the backend does not recognize', () => {
        expect(paymentMethodsToApi(['Bitcoin'])).toEqual([])
    })
    it('maps every UI required field to a known backend value and back', () => {
        const fields = ['Documento', 'Email', 'Teléfono', 'Fecha de nacimiento', 'Dirección']
        const apiFields = requiredFieldsToApi(fields)
        expect(apiFields).toEqual(['document', 'email', 'phone', 'birthDate', 'address'])
        expect(requiredFieldsFromApi(apiFields)).toEqual(fields)
    })
    it('ignores backend fields with no UI equivalent instead of crashing', () => {
        expect(requiredFieldsFromApi(['guardianName', 'document'])).toEqual(['Documento'])
    })
})
