import { describe, expect, it } from 'vitest'
import { validatePaymentSettings } from './paymentSettingsValidation'

const empty = { transferAlias: '', transferCbu: '', accountHolder: '', paymentLink: '' }

describe('payment settings validation', () => {
    it('accepts cash without extra data and disabled methods left empty', () => {
        expect(validatePaymentSettings({ ...empty, enabledMethods: ['Efectivo'] }).valid).toBe(true)
    })

    it('requires alias or CBU and the account holder for a transfer', () => {
        expect(Object.keys(validatePaymentSettings({ ...empty, enabledMethods: ['Transferencia'] }).fieldErrors ?? {})).toEqual(['paymentsTransferAlias', 'paymentsAccountHolder'])
        expect(validatePaymentSettings({ ...empty, enabledMethods: ['Transferencia'], transferCbu: '0000003100000000000000', accountHolder: 'Academia SRL' }).valid).toBe(true)
    })

    it('requires the link for Mercado Pago', () => {
        expect(Object.keys(validatePaymentSettings({ ...empty, enabledMethods: ['Mercado Pago'] }).fieldErrors ?? {})).toEqual(['paymentsPaymentLink'])
        expect(validatePaymentSettings({ ...empty, enabledMethods: ['Mercado Pago'], paymentLink: 'https://mpago.la/x' }).valid).toBe(true)
    })
})
