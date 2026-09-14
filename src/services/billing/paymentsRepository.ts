import { initialPayments } from '@/data/payments'
import { getCommissionMonthlyDueDates, getInstallmentMonthLabel } from '@/domain/billing/billingRules'
import { getLocalDateString } from '@/domain/shared/dateRules'
import type { ChargePaymentSnapshot, Payment } from '@/types/domain'
import { paymentReadModelToChargeSnapshot } from '@/domain/billing/paymentRules'
import { readAcademyState, updateAcademyState } from '@/services/academy/academyState'
import type { ManualCharge, PaymentChannel, PaymentUpdate } from '@/services/academy/academyTypes'
import { listCourses } from '@/services/academy/coursesRepository'
import { getPublicEnrollmentOffer, listEnrollmentOpenings } from '@/services/academy/enrollmentsRepository'
import { listPrivateLessons } from '@/services/academy/privateLessonsRepository'
import { listStudents } from '@/services/academy/studentsRepository'

type LegacyPaymentRecord = Payment & { originalAmount: number; lastReminderAt?: string }
export type PaymentRecord = LegacyPaymentRecord & { chargeSnapshot: ChargePaymentSnapshot }

export function confirmPaymentRecord(id: string, method: Payment['method'], date = getLocalDateString()) {
    updatePaymentRecord(id, { status: 'Pagado', method, date })
}

export function updatePaymentRecord(id: string, changes: PaymentUpdate) {
    updateAcademyState((current) => {
        const paymentUpdate = { ...current.paymentUpdates[id], ...changes }
        const registrationId = id.startsWith('PAY-REG-') ? id.slice(4) : null
        const paymentMethod = paymentUpdate.method === 'Tarjeta' ? 'Mercado Pago' : paymentUpdate.method
        return { ...current, paymentUpdates: { ...current.paymentUpdates, [id]: paymentUpdate }, registrations: registrationId && paymentUpdate.status === 'Pagado' ? current.registrations.map((registration) => registration.id === registrationId ? { ...registration, paid: true, paidAt: paymentUpdate.date ?? getLocalDateString(), transferReported: false, paymentMethod: paymentMethod as PaymentChannel } : registration) : current.registrations }
    })
}

export function listPayments(): PaymentRecord[] {
    const state = readAcademyState()
    const registrationPayments = state.registrations.flatMap((registration): LegacyPaymentRecord[] => {
        const offer = getPublicEnrollmentOffer(registration.offerSlug)
        const opening = offer ? listEnrollmentOpenings().find((item) => item.id === offer.openingId) : null
        const commission = offer?.commissions.find((item) => item.id === registration.commissionId) ?? offer?.commissions[0]
        return offer && commission ? [{ id: `PAY-${registration.id}`, student: registration.fullName, concept: `Inscripción · ${offer.courseName} · ${commission.name}`, method: registration.paymentMethod === 'Mercado Pago' ? 'Tarjeta' : registration.paymentMethod === 'Efectivo' ? 'Efectivo' : 'Transferencia', date: registration.paid ? registration.paidAt ?? registration.createdAt ?? getLocalDateString() : '-', dueDate: opening?.endDate ?? registration.createdAt ?? getLocalDateString(), amount: offer.amount, originalAmount: offer.amount, status: registration.paid ? 'Pagado' : registration.transferReported ? 'En verificación' : 'Pendiente' }] : []
    })
    const tuitionPayments = state.registrations.filter((registration) => registration.paid).flatMap((registration): LegacyPaymentRecord[] => {
        const offer = getPublicEnrollmentOffer(registration.offerSlug)
        const course = offer ? listCourses().find((item) => item.id === offer.courseId) : null
        const commission = course?.commissions.find((item) => item.id === registration.commissionId) ?? course?.commissions[0]
        if (!offer || !course || !commission) return []
        return getCommissionMonthlyDueDates(commission).map((dueDate) => ({ id: `PAY-TUITION-${registration.id}-${dueDate.slice(0, 7)}`, student: registration.fullName, concept: `Cuota ${getInstallmentMonthLabel(dueDate)} · ${course.name} · ${commission.name}`, method: 'Transferencia', date: '-', dueDate, amount: commission.amount, originalAmount: commission.amount, status: 'Pendiente' }))
    })
    const studentNames = new Map(listStudents().map((student) => [student.id, student.fullName]))
    const assignmentPayments = state.assignments.flatMap((assignment): LegacyPaymentRecord[] => {
        const match = listCourses().flatMap((course) => course.commissions.map((commission) => ({ course, commission }))).find(({ course, commission }) => assignment.commissionId ? commission.id === assignment.commissionId : course.name === assignment.courseName && commission.name === assignment.commissionName)
        const amount = match?.commission.amount ?? assignment.amount
        const student = studentNames.get(assignment.studentId)
        if (!student || !amount || !match) return []
        return getCommissionMonthlyDueDates(match.commission).map((dueDate) => ({ id: `PAY-ASSIGN-${assignment.studentId}-${match.commission.id}-${dueDate.slice(0, 7)}`, student, concept: `Cuota ${getInstallmentMonthLabel(dueDate)} · ${match.course.name} · ${match.commission.name}`, method: 'Transferencia', date: '-', dueDate, amount, originalAmount: amount, status: 'Pendiente' }))
    })
    const privateLessonPayments = listPrivateLessons().flatMap((lesson): LegacyPaymentRecord[] => {
        const student = studentNames.get(lesson.studentId)
        if (!student || lesson.status !== 'Activa') return []
        const count = lesson.plan === 'Pack 4 clases' ? 4 : lesson.plan === 'Pack 8 clases' ? 8 : lesson.plan === 'Pack 12 clases' ? 12 : 1
        const amount = lesson.plan === 'Plan mensual' ? lesson.costPerClass : lesson.costPerClass * count
        return [{ id: `PAY-PRIVATE-${lesson.id}`, student, concept: `Clases particulares · ${lesson.plan}`, method: 'Transferencia', date: '-', dueDate: '2026-08-31', amount, originalAmount: amount, status: 'Pendiente' }]
    })
    const manualPayments = state.manualCharges.map((charge): LegacyPaymentRecord => ({ id: charge.id, student: charge.student || 'Sin alumno asociado', concept: `${charge.category}${charge.detail ? ` · ${charge.detail}` : ''}`, method: charge.method, date: charge.date, dueDate: charge.dueDate, amount: charge.amount, originalAmount: charge.amount, status: charge.status }))
    return [...initialPayments, ...registrationPayments, ...tuitionPayments, ...assignmentPayments, ...privateLessonPayments, ...manualPayments]
        .map((payment) => state.paymentUpdates[payment.id] ? { ...payment, ...state.paymentUpdates[payment.id] } : payment)
        .filter((payment) => !state.paymentUpdates[payment.id]?.deleted)
        .map((payment) => ({ ...payment, chargeSnapshot: paymentReadModelToChargeSnapshot(payment) }))
}

export function createManualCharge(charge: Omit<ManualCharge, 'id'>) {
    const next = { ...charge, id: `PAY-MANUAL-${Date.now()}` }
    updateAcademyState((current) => ({ ...current, manualCharges: [...current.manualCharges, next] }))
    return next
}
