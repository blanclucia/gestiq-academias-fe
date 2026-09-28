import { describe, expect, it } from 'vitest'
import { chargeMethodFromApi, chargeMethodToApi, chargeStatusFromApi, chargeStatusFromApiWithPartial, chargeStatusToApi } from './chargesMapping'

describe('charge status and method mapping', () => {
    it('maps status both ways', () => {
        expect(chargeStatusToApi('Pendiente')).toBe('pending')
        expect(chargeStatusToApi('Pagado')).toBe('paid')
        expect(chargeStatusToApi('En verificación')).toBe('under_review')
        expect(chargeStatusToApi('Rechazado')).toBe('rejected')
        expect(chargeStatusFromApi('pending')).toBe('Pendiente')
        expect(chargeStatusFromApi('paid')).toBe('Pagado')
        expect(chargeStatusFromApi('under_review')).toBe('En verificación')
        expect(chargeStatusFromApi('rejected')).toBe('Rechazado')
    })
    it('maps method both ways', () => {
        expect(chargeMethodToApi('Transferencia')).toBe('transfer')
        expect(chargeMethodToApi('Tarjeta')).toBe('card')
        expect(chargeMethodToApi('Efectivo')).toBe('cash')
        expect(chargeMethodFromApi('transfer')).toBe('Transferencia')
        expect(chargeMethodFromApi('card')).toBe('Tarjeta')
        expect(chargeMethodFromApi('cash')).toBe('Efectivo')
    })
})

describe('chargeStatusFromApiWithPartial', () => {
    it('labels a pending charge with a real partial payment as Parcial', () => {
        expect(chargeStatusFromApiWithPartial({ status: 'pending', amount: 1000, paidAmount: 400 })).toBe('Parcial')
    })
    it('keeps a pending charge with no payment as Pendiente', () => {
        expect(chargeStatusFromApiWithPartial({ status: 'pending', amount: 1000, paidAmount: undefined })).toBe('Pendiente')
        expect(chargeStatusFromApiWithPartial({ status: 'pending', amount: 1000, paidAmount: 0 })).toBe('Pendiente')
    })
    it('does not treat a fully paid amount as partial', () => {
        expect(chargeStatusFromApiWithPartial({ status: 'pending', amount: 1000, paidAmount: 1000 })).toBe('Pendiente')
    })
    it('passes through non-pending statuses unchanged', () => {
        expect(chargeStatusFromApiWithPartial({ status: 'paid', amount: 1000, paidAmount: 1000 })).toBe('Pagado')
        expect(chargeStatusFromApiWithPartial({ status: 'under_review', amount: 1000, paidAmount: undefined })).toBe('En verificación')
        expect(chargeStatusFromApiWithPartial({ status: 'rejected', amount: 1000, paidAmount: undefined })).toBe('Rechazado')
    })
})
