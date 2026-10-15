import { describe, expect, it } from 'vitest'
import { getPublicPaymentOptions, requiresPaymentStep } from './publicPaymentOptions'

const empty = { paymentLink: '', transferAlias: '', transferCbu: '' }

describe('public payment options', () => {
    it('offers only methods that are enabled and configured', () => {
        expect(getPublicPaymentOptions({ ...empty, enabledMethods: ['Mercado Pago', 'Transferencia', 'Efectivo'], paymentLink: 'https://mpago.la/x', transferAlias: 'ACADEMIA.MP' }))
            .toEqual({ mercadoPago: true, transfer: true, inPerson: true })
    })

    it('hides a transfer without alias or CBU and Mercado Pago without a link', () => {
        expect(getPublicPaymentOptions({ ...empty, enabledMethods: ['Mercado Pago', 'Transferencia', 'Efectivo'] }))
            .toEqual({ mercadoPago: false, transfer: false, inPerson: true })
    })

    it('falls back to paying in person when nothing else is usable', () => {
        expect(getPublicPaymentOptions({ ...empty, enabledMethods: ['Transferencia'] })).toEqual({ mercadoPago: false, transfer: false, inPerson: true })
        expect(getPublicPaymentOptions({ ...empty, enabledMethods: [] })).toEqual({ mercadoPago: false, transfer: false, inPerson: true })
    })

    it('does not add in-person payment when another usable method exists and cash is disabled', () => {
        expect(getPublicPaymentOptions({ ...empty, enabledMethods: ['Transferencia'], transferCbu: '0000003100000000000000' }))
            .toEqual({ mercadoPago: false, transfer: true, inPerson: false })
    })

    it('skips the payment step only for free enrollments', () => {
        expect(requiresPaymentStep(48000)).toBe(true)
        expect(requiresPaymentStep(0)).toBe(false)
    })
})
