import { format, isBefore, parseISO } from 'date-fns'
import type { BillingDisplayStatus, ChargePaymentSnapshot, Payment } from '@/types/domain'

type PaymentStatusView = Payment['status']
type PaymentDates = Pick<Payment, 'status' | 'date' | 'dueDate'>

export function resolveChargeCollectionStatus(charge: ChargePaymentSnapshot, today: Date): BillingDisplayStatus {
    if (charge.lifecycleStatus === 'void') return 'Anulado'
    if (charge.paymentStatus === 'rejected') return 'Rechazado'
    if (charge.paymentStatus === 'reported' || charge.paymentStatus === 'under_review') return 'En verificación'
    if (charge.paidAmount >= charge.adjustedAmount) return 'Pagado'
    if (charge.paidAmount > 0) return 'Parcial'
    return isBefore(parseISO(charge.dueDate), today) ? 'Vencido' : 'Pendiente'
}

export function paymentReadModelToChargeSnapshot(payment: Payment): ChargePaymentSnapshot {
    const paymentStatus = payment.status === 'Pagado' ? 'confirmed' : payment.status === 'En verificación' ? 'under_review' : payment.status === 'Rechazado' ? 'rejected' : undefined
    return {
        lifecycleStatus: payment.status === 'Anulado' ? 'void' : 'open',
        paymentStatus,
        adjustedAmount: payment.amount,
        paidAmount: payment.status === 'Pagado' ? payment.amount : payment.status === 'Parcial' ? payment.amount / 2 : 0,
        dueDate: payment.dueDate,
        paidAt: payment.date === '-' ? undefined : payment.date,
    }
}

export function getPaymentDisplayDate(dateText: string) {
    return !dateText || dateText === '-' ? 'Sin registrar' : format(parseISO(dateText), 'dd/MM/yyyy')
}

export function resolvePaymentStatus(payment: PaymentDates, today: Date): PaymentStatusView {
    if (payment.status !== 'Pendiente') return payment.status
    return resolveChargeCollectionStatus({ lifecycleStatus: 'open', adjustedAmount: 1, paidAmount: 0, dueDate: payment.dueDate }, today)
}

export function getPaymentReferenceDate(payment: PaymentDates, status: PaymentStatusView) {
    return status === 'Pagado' && payment.date !== '-' ? payment.date : payment.dueDate
}

export function getPaymentReminderLabel(payment: Pick<Payment, 'dueDate'>, status: PaymentStatusView, today: Date) {
    if (status === 'Pagado') return 'No aplica'
    if (status === 'Rechazado') return 'Pago rechazado'

    const daysToDue = Math.ceil((parseISO(payment.dueDate).getTime() - today.getTime()) / 86_400_000)
    if (daysToDue <= 0) return 'Vencido'
    if (daysToDue <= 3) return `Vence en ${daysToDue} día${daysToDue === 1 ? '' : 's'}`
    return 'Sin urgencia'
}
