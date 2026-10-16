import { describe, expect, it } from 'vitest'
import { getPublicPaymentOptions, requiresPaymentStep } from './publicPaymentOptions'

const empty = { paymentLink: '', transferAlias: '', transferCbu: '', accountHolder: '', accountTaxId: '' }
const fullTransfer = { transferAlias: 'ACADEMIA.MP', transferCbu: '0000003100000000000000', accountHolder: 'Academia SRL', accountTaxId: '30-71234567-8' }

describe('public payment options', () => {
    it('offers only methods that are enabled and configured', () => {
        expect(getPublicPaymentOptions({ ...empty, enabledMethods: ['Mercado Pago', 'Transferencia', 'Efectivo'], paymentLink: 'https://mpago.la/x', ...fullTransfer }))
            .toEqual({ mercadoPago: true, transfer: true, inPerson: true })
    })

    it('hides an incomplete transfer and Mercado Pago without a link', () => {
        expect(getPublicPaymentOptions({ ...empty, ...fullTransfer, accountTaxId: '', enabledMethods: ['Transferencia', 'Efectivo'] }).transfer).toBe(false)
        expect(getPublicPaymentOptions({ ...empty, enabledMethods: ['Mercado Pago', 'Transferencia', 'Efectivo'] }))
            .toEqual({ mercadoPago: false, transfer: false, inPerson: true })
    })

    it('falls back to paying in person when nothing else is usable', () => {
        expect(getPublicPaymentOptions({ ...empty, enabledMethods: ['Transferencia'] })).toEqual({ mercadoPago: false, transfer: false, inPerson: true })
        expect(getPublicPaymentOptions({ ...empty, enabledMethods: [] })).toEqual({ mercadoPago: false, transfer: false, inPerson: true })
    })

    it('does not add in-person payment when another usable method exists and cash is disabled', () => {
        expect(getPublicPaymentOptions({ ...empty, ...fullTransfer, enabledMethods: ['Transferencia'] }))
            .toEqual({ mercadoPago: false, transfer: true, inPerson: false })
    })

    it('skips the payment step only for free enrollments', () => {
        expect(requiresPaymentStep(48000)).toBe(true)
        expect(requiresPaymentStep(0)).toBe(false)
    })
})
