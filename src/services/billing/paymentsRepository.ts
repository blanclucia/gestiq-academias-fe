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
        privateLessonId: charge.privateLessonId ?? undefined,
    }
}

function sameChargesMirror(current: RealCharge[], next: RealCharge[]): boolean {
    return JSON.stringify(current) === JSON.stringify(next)
}

// listPayments() stays synchronous — BillingPage and its modals read it outside a data-fetching
// lifecycle. Every charge is real (cuotas de comisión, cargos manuales, inscripciones, clases
// particulares y cuotas de exámenes) and comes from the local mirror kept warm by useCharges()/<ChargesSync>.
export function listPayments(): PaymentRecord[] {
    const state = readAcademyState()
    const studentNames = new Map(listStudents().map((student) => [student.id, student.fullName]))
    const realCharges: LegacyPaymentRecord[] = state.charges.map((charge) => ({
        id: charge.id, student: studentNames.get(charge.studentId) ?? 'Alumno no encontrado', studentId: charge.studentId, concept: charge.concept,
        method: charge.method, date: charge.date, dueDate: charge.dueDate, amount: charge.amount, originalAmount: charge.amount,
        status: charge.status, isReal: true,
    }))
    return realCharges
        .map((payment) => state.paymentUpdates[payment.id] ? { ...payment, ...state.paymentUpdates[payment.id] } : payment)
        .filter((payment) => !state.paymentUpdates[payment.id]?.deleted)
        .map((payment) => ({ ...payment, chargeSnapshot: paymentReadModelToChargeSnapshot(payment) }))
}

// What each private lesson still has to collect: its unpaid charges (paid and voided ones excluded).
export function listPendingByPrivateLesson(): Map<string, number> {
    const pending = new Map<string, number>()
    for (const charge of readAcademyState().charges) {
        if (!charge.privateLessonId || charge.status === 'Pagado' || charge.status === 'Anulado') continue
        pending.set(charge.privateLessonId, (pending.get(charge.privateLessonId) ?? 0) + charge.amount)
    }
    return pending
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
        onSuccess: (_result, { changes }) => {
            queryClient.invalidateQueries({ queryKey: ['charges', organizationSlug] })
            // Paying an enrollment fee confirms its registration backend-side (the student joins the
            // commission), so the registrations, course counts and rosters go stale too.
            if (changes.status === 'paid') {
                queryClient.invalidateQueries({ queryKey: ['enrollment-registrations', organizationSlug] })
                queryClient.invalidateQueries({ queryKey: ['courses', organizationSlug] })
                queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'commission-roster' })
            }
        },
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
