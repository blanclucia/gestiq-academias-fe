import { describe, expect, it } from 'vitest'
import { getRecordablePaymentMethods, paymentMethods } from './paymentMethods'

describe('getRecordablePaymentMethods', () => {
    it('offers the methods enabled in the settings, Mercado Pago included', () => {
        expect(getRecordablePaymentMethods(['Efectivo', 'Mercado Pago'])).toEqual(['Mercado Pago', 'Efectivo'])
    })

    it('falls back to every method when none is enabled', () => {
        expect(getRecordablePaymentMethods([])).toEqual(paymentMethods)
        expect(getRecordablePaymentMethods(undefined)).toEqual(paymentMethods)
    })
})
