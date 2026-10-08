import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/AuthContext'
import { getLocalDateString } from '@/domain/shared/dateRules'
import type { ChargePaymentSnapshot, Payment } from '@/types/domain'
import { paymentReadModelToChargeSnapshot } from '@/domain/billing/paymentRules'
import { readAcademyState, updateAcademyState } from '@/services/academy/academyState'
import type { PaymentUpdate, RealCharge } from '@/services/academy/academyTypes'
import { listStudents } from '@/services/academy/studentsRepository'
import { createChargeApi, deleteChargeApi, fetchCharges, generateTuitionApi, updateChargeApi, type ApiCharge, type ApiChargeInput, type ApiChargePatch } from '@/services/organization/chargesApi'
import { chargeMethodFromApi, chargeStatusFromApiWithPartial } from '@/services/organization/chargesMapping'

type LegacyPaymentRecord = Payment & { originalAmount: number; lastReminderAt?: string; isReal?: boolean }
export type PaymentRecord = LegacyPaymentRecord & { chargeSnapshot: ChargePaymentSnapshot }

export function confirmPaymentRecord(id: string, method: Payment['method'], date = getLocalDateString()) {
    updatePaymentRecord(id, { status: 'Pagado', method, date })
}

export function updatePaymentRecord(id: string, changes: PaymentUpdate) {
    updateAcademyState((current) => ({ ...current, paymentUpdates: { ...current.paymentUpdates, [id]: { ...current.paymentUpdates[id], ...changes } } }))
}

// Una inscripción pública ya crea un Charge real (ver el módulo de Inscripciones) — no queda ningún
// id sintético "PAY-REG-*" que pudiera bloquear su borrado, único caso que esta función cubría.
export function getPaymentRemovalBlocker(): string | null {
    return null
}

function fromApiCharge(charge: ApiCharge): RealCharge {
    return {
        id: charge.id,
        studentId: charge.studentId,
        commissionId: charge.commissionId,
        source: charge.source,
        concept: charge.concept,
        amount: charge.amount,
        dueDate: charge.dueDate,
        status: chargeStatusFromApiWithPartial(charge),
        method: charge.method ? chargeMethodFromApi(charge.method) : 'Transferencia',
        date: charge.status === 'paid' && charge.paidAt ? charge.paidAt : '-',
        notes: charge.notes,
    }
}

function sameChargesMirror(current: RealCharge[], next: RealCharge[]): boolean {
    return JSON.stringify(current) === JSON.stringify(next)
}

// listPayments() stays synchronous — BillingPage and its modals read it outside a data-fetching
// lifecycle. Real charges (cuotas de comisión + cargos manuales + cuotas de inscripción, desde que
// Inscripciones es real) come from the local mirror kept warm by useCharges()/<ChargesSync>;
// old-assignment/exam rows stay exactly as before — those sources are still 100% mock.
export function listPayments(): PaymentRecord[] {
    const state = readAcademyState()
    const studentNames = new Map(listStudents().map((student) => [student.id, student.fullName]))
    const realCharges: LegacyPaymentRecord[] = state.charges.map((charge) => ({
        id: charge.id, student: studentNames.get(charge.studentId) ?? 'Alumno no encontrado', studentId: charge.studentId, concept: charge.concept,
        method: charge.method, date: charge.date, dueDate: charge.dueDate, amount: charge.amount, originalAmount: charge.amount,
        status: charge.status, isReal: true,
    }))
    // Exam-fee installments (examinationsRepository.ts) still write directly into state.manualCharges
    // — that module remains 100% mock, unrelated to the real "Nuevo cobro" flow in BillingPage.
    const examManualCharges: LegacyPaymentRecord[] = state.manualCharges.map((charge) => ({ id: charge.id, student: charge.student || 'Sin alumno asociado', concept: `${charge.category}${charge.detail ? ` · ${charge.detail}` : ''}`, method: charge.method, date: charge.date, dueDate: charge.dueDate, amount: charge.amount, originalAmount: charge.amount, status: charge.status }))
    return [...realCharges, ...examManualCharges]
        .map((payment) => state.paymentUpdates[payment.id] ? { ...payment, ...state.paymentUpdates[payment.id] } : payment)
        .filter((payment) => !state.paymentUpdates[payment.id]?.deleted)
        .map((payment) => ({ ...payment, chargeSnapshot: paymentReadModelToChargeSnapshot(payment) }))
}

export function useCharges(options: { enabled?: boolean } = {}) {
    const { session } = useAuth()
    const organizationSlug = session?.organization.slug
    const query = useQuery({
        queryKey: ['charges', organizationSlug],
        queryFn: ({ signal }) => fetchCharges(organizationSlug!, {}, signal),
        enabled: Boolean(organizationSlug) && (options.enabled ?? true),
    })
    useEffect(() => {
        if (!query.data) return
        const mapped = query.data.map(fromApiCharge)
        if (!sameChargesMirror(readAcademyState().charges, mapped)) {
            updateAcademyState((current) => ({ ...current, charges: mapped }))
        }
    }, [query.data])
    return { isLoading: query.isLoading, isError: query.isError }
}

export function useCreateCharge() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async (input: ApiChargeInput) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            return createChargeApi(organizationSlug, input)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['charges', organizationSlug] }),
    })
}

export function useUpdateCharge() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async ({ id, changes }: { id: string; changes: ApiChargePatch }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            return updateChargeApi(organizationSlug, id, changes)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['charges', organizationSlug] }),
    })
}

export function useDeleteCharge() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async (id: string) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            await deleteChargeApi(organizationSlug, id)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['charges', organizationSlug] }),
    })
}

export function useGenerateTuition() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async ({ studentId, commissionId }: { studentId: string; commissionId: string }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            return generateTuitionApi(organizationSlug, studentId, commissionId)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['charges', organizationSlug] }),
    })
}
