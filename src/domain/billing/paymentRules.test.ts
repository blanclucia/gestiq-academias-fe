import { describe, expect, it } from 'vitest'
import { getPaymentReferenceDate, getPaymentReminderLabel, resolveChargeCollectionStatus, resolvePaymentStatus } from './paymentRules'

describe('payment rules', () => {
    const today = new Date('2026-09-09T00:00:00')

    it('derives overdue state only from pending payments', () => {
        expect(resolvePaymentStatus({ status: 'Pendiente', date: '-', dueDate: '2026-09-08' }, today)).toBe('Vencido')
        expect(resolvePaymentStatus({ status: 'Pagado', date: '2026-09-01', dueDate: '2026-09-08' }, today)).toBe('Pagado')
    })

    it('derives collection state from charge balance and lifecycle', () => {
        expect(resolveChargeCollectionStatus({ lifecycleStatus: 'open', adjustedAmount: 100, paidAmount: 40, dueDate: '2026-09-20' }, today)).toBe('Parcial')
        expect(resolveChargeCollectionStatus({ lifecycleStatus: 'open', paymentStatus: 'confirmed', adjustedAmount: 100, paidAmount: 100, dueDate: '2026-09-20' }, today)).toBe('Pagado')
        expect(resolveChargeCollectionStatus({ lifecycleStatus: 'open', adjustedAmount: 100, paidAmount: 0, dueDate: '2026-09-08' }, today)).toBe('Vencido')
        expect(resolveChargeCollectionStatus({ lifecycleStatus: 'void', adjustedAmount: 100, paidAmount: 0, dueDate: '2026-09-08' }, today)).toBe('Anulado')
    })

    it('keeps payment processing separate from collection state', () => {
        expect(resolveChargeCollectionStatus({ lifecycleStatus: 'open', paymentStatus: 'under_review', adjustedAmount: 100, paidAmount: 0, dueDate: '2026-09-08' }, today)).toBe('En verificación')
        expect(resolveChargeCollectionStatus({ lifecycleStatus: 'open', paymentStatus: 'rejected', adjustedAmount: 100, paidAmount: 0, dueDate: '2026-09-20' }, today)).toBe('Rechazado')
    })

    it('selects the operational date for filtering', () => {
        expect(getPaymentReferenceDate({ status: 'Pagado', date: '2026-09-01', dueDate: '2026-09-08' }, 'Pagado')).toBe('2026-09-01')
        expect(getPaymentReferenceDate({ status: 'Pendiente', date: '-', dueDate: '2026-09-08' }, 'Pendiente')).toBe('2026-09-08')
    })

    it('describes reminder urgency', () => {
        expect(getPaymentReminderLabel({ dueDate: '2026-09-10' }, 'Pendiente', today)).toBe('Vence en 1 día')
        expect(getPaymentReminderLabel({ dueDate: '2026-09-20' }, 'Pendiente', today)).toBe('Sin urgencia')
    })
})
