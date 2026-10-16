import { describe, expect, it } from 'vitest'
import { validatePaymentSettings } from './paymentSettingsValidation'

const empty = { transferAlias: '', transferCbu: '', accountHolder: '', accountTaxId: '', paymentLink: '' }
const fullTransfer = { transferAlias: 'ACADEMIA.MP', transferCbu: '0000003100000000000000', accountHolder: 'Academia SRL', accountTaxId: '30-71234567-1' }

describe('payment settings validation', () => {
    it('accepts cash without extra data and disabled methods left empty', () => {
        expect(validatePaymentSettings({ ...empty, enabledMethods: ['Efectivo'] }).valid).toBe(true)
    })

    it('requires alias, CBU, account holder and CUIT for a transfer', () => {
        expect(Object.keys(validatePaymentSettings({ ...empty, enabledMethods: ['Transferencia'] }).fieldErrors ?? {})).toEqual(['paymentsTransferAlias', 'paymentsTransferCbu', 'paymentsAccountHolder', 'paymentsAccountTaxId'])
        expect(Object.keys(validatePaymentSettings({ ...empty, ...fullTransfer, accountTaxId: ' ', enabledMethods: ['Transferencia'] }).fieldErrors ?? {})).toEqual(['paymentsAccountTaxId'])
        // A CUIT with a wrong check digit, an alias with spaces or a short CBU can't be used to transfer.
        expect(Object.keys(validatePaymentSettings({ ...empty, ...fullTransfer, accountTaxId: '30-71234567-8', transferAlias: 'mi alias', transferCbu: '123', enabledMethods: ['Transferencia'] }).fieldErrors ?? {}).sort()).toEqual(['paymentsAccountTaxId', 'paymentsTransferAlias', 'paymentsTransferCbu'])
        expect(validatePaymentSettings({ ...empty, ...fullTransfer, enabledMethods: ['Transferencia'] }).valid).toBe(true)
    })

    it('requires the link for Mercado Pago', () => {
        expect(Object.keys(validatePaymentSettings({ ...empty, enabledMethods: ['Mercado Pago'] }).fieldErrors ?? {})).toEqual(['paymentsPaymentLink'])
        expect(validatePaymentSettings({ ...empty, enabledMethods: ['Mercado Pago'], paymentLink: 'https://mpago.la/x' }).valid).toBe(true)
    })
})
