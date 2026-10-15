import { describe, expect, it } from 'vitest'
import { getPaymentReferenceDate, getPaymentReminderLabel, resolveChargeCollectionStatus, resolvePaymentStatus, summarizeChargesToManage } from './paymentRules'

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

    it('delays "Vencido" by the configured grace period', () => {
        const charge = { lifecycleStatus: 'open' as const, adjustedAmount: 100, paidAmount: 0, dueDate: '2026-09-08' }
        expect(resolveChargeCollectionStatus(charge, today, 5)).toBe('Pendiente')
        expect(resolveChargeCollectionStatus({ ...charge, dueDate: '2026-09-01' }, today, 5)).toBe('Vencido')
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

describe('summarizeChargesToManage', () => {
    const charges = [
        { id: 'overdue-last-month', status: 'Vencido' as const, dueDate: '2026-09-10' },
        { id: 'pending-this-month', status: 'Pendiente' as const, dueDate: '2026-10-20' },
        { id: 'under-review', status: 'En verificación' as const, dueDate: '2026-10-05' },
        { id: 'paid', status: 'Pagado' as const, dueDate: '2026-10-10' },
        { id: 'void', status: 'Anulado' as const, dueDate: '2026-10-10' },
        { id: 'next-month', status: 'Pendiente' as const, dueDate: '2026-11-10' },
    ]

    it('includes overdue charges from earlier months and unpaid ones due this month', () => {
        const { overdue, pending } = summarizeChargesToManage(charges, '2026-10-31')
        expect(overdue.map((charge) => charge.id)).toEqual(['overdue-last-month'])
        expect(pending.map((charge) => charge.id)).toEqual(['pending-this-month', 'under-review'])
    })

    it('leaves out paid, voided and next-month charges', () => {
        const { overdue, pending } = summarizeChargesToManage(charges, '2026-10-31')
        expect([...overdue, ...pending].map((charge) => charge.id)).not.toContain('void')
        expect([...overdue, ...pending].map((charge) => charge.id)).not.toContain('next-month')
    })
})

