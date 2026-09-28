import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/AuthContext'
import { resolveEnrollmentAvailability } from '@/domain/enrollments/enrollmentRules'
import { getLocalDateString } from '@/domain/shared/dateRules'
import {
    confirmRegistrationApi, createEnrollmentOpeningApi, deleteEnrollmentOpeningApi, fetchEnrollmentOpenings, fetchEnrollmentRegistrations,
    fetchPublicOffer, registerPubliclyApi, updateEnrollmentOpeningApi, updateRegistrationNotesApi,
    type ApiOpening, type ApiOpeningCreate, type ApiOpeningPatch, type ApiPublicRegistrationInput, type ApiRegistrationSummary,
} from '@/services/organization/enrollmentsApi'
import { openingStatusFromApi, openingStatusToApi } from '@/services/organization/enrollmentsMapping'
import { chargeStatusFromApi } from '@/services/organization/chargesMapping'
import { readAcademyState, updateAcademyState } from './academyState'
import type { EnrollmentOpening } from './academyTypes'

export type PublicEnrollmentOffer = {
    slug: string
    openingId: string
    courseId: string
    courseName: string
    amount: number
    status: 'Abierta' | 'Programada' | 'Cerrada'
    startDate: string
    endDate: string
    commissions: Array<{ id: string; name: string; schedule: string; amount: number; capacity: number; occupied: number; startDate: string; endDate: string }>
}

export type EnrollmentRegistrationRow = {
    id: string
    studentId: string
    name: string
    email: string
    phone: string
    commissionId: string
    commissionName: string
    chargeId: string
    chargeAmount: number
    payment: 'Pendiente' | 'Pagado' | 'En verificación' | 'Rechazado'
    rosterConfirmed: boolean
    notes: string
    createdAt: string
}

function fromApiOpening(opening: ApiOpening): EnrollmentOpening {
    return {
        id: opening.id, slug: opening.slug, courseId: opening.courseId, commissionIds: opening.commissionIds,
        amount: opening.amount, startDate: opening.startDate, endDate: opening.endDate,
        status: openingStatusFromApi(opening.status), registrationsCount: opening.registrationsCount,
    }
}
function sameOpeningsMirror(current: EnrollmentOpening[], next: EnrollmentOpening[]): boolean {
    return JSON.stringify(current) === JSON.stringify(next)
}

// listEnrollmentOpenings() stays synchronous — agendaRepository.ts, commissionsRepository.ts y las
// propias páginas de Ofertas académicas la leen fuera de un ciclo de fetch. Lee el mismo mirror en
// AcademyState.openings, poblado por el fetch real (useEnrollmentOpenings()/<EnrollmentOpeningsSync>).
export function listEnrollmentOpenings(courseId?: string): EnrollmentOpening[] {
    const openings = readAcademyState().openings
    return courseId ? openings.filter((opening) => opening.courseId === courseId) : openings
}

export function useEnrollmentOpenings(options: { enabled?: boolean } = {}) {
    const { session } = useAuth()
    const organizationSlug = session?.organization.slug
    const query = useQuery({
        queryKey: ['enrollment-openings', organizationSlug],
        queryFn: ({ signal }) => fetchEnrollmentOpenings(organizationSlug!, {}, signal),
        enabled: Boolean(organizationSlug) && (options.enabled ?? true),
    })
    useEffect(() => {
        if (!query.data) return
        const mapped = query.data.map(fromApiOpening)
        if (!sameOpeningsMirror(readAcademyState().openings, mapped)) {
            updateAcademyState((current) => ({ ...current, openings: mapped }))
        }
    }, [query.data])
    return { openings: listEnrollmentOpenings(), isLoading: query.isLoading, isError: query.isError }
}

function toApiOpeningInput(input: { courseId: string; commissionIds: string[]; amount: number; startDate: string; endDate: string; status: 'Abierta' | 'Programada' | 'Cerrada' }): ApiOpeningCreate {
    return { courseId: input.courseId, commissionIds: input.commissionIds, amount: input.amount, startDate: input.startDate, endDate: input.endDate, status: openingStatusToApi(input.status) }
}

export function useCreateEnrollmentOpening() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async (input: Parameters<typeof toApiOpeningInput>[0]) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            return fromApiOpening(await createEnrollmentOpeningApi(organizationSlug, toApiOpeningInput(input)))
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enrollment-openings', organizationSlug] }),
    })
}

export function useUpdateEnrollmentOpening() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async ({ id, changes }: { id: string; changes: Partial<Parameters<typeof toApiOpeningInput>[0]> }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            const patch: ApiOpeningPatch = {}
            if (changes.commissionIds !== undefined) patch.commissionIds = changes.commissionIds
            if (changes.amount !== undefined) patch.amount = changes.amount
            if (changes.startDate !== undefined) patch.startDate = changes.startDate
            if (changes.endDate !== undefined) patch.endDate = changes.endDate
            if (changes.status !== undefined) patch.status = openingStatusToApi(changes.status)
            return fromApiOpening(await updateEnrollmentOpeningApi(organizationSlug, id, patch))
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enrollment-openings', organizationSlug] }),
    })
}

export function useDeleteEnrollmentOpening() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async (id: string) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            await deleteEnrollmentOpeningApi(organizationSlug, id)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enrollment-openings', organizationSlug] }),
    })
}

function fromApiRegistration(registration: ApiRegistrationSummary): EnrollmentRegistrationRow {
    return {
        id: registration.id, studentId: registration.studentId, name: registration.studentFullName,
        email: registration.studentEmail, phone: registration.studentPhone,
        commissionId: registration.commissionId, commissionName: registration.commissionName,
        chargeId: registration.chargeId, chargeAmount: registration.chargeAmount,
        payment: chargeStatusFromApi(registration.chargeStatus), rosterConfirmed: registration.rosterConfirmed,
        notes: registration.adminNotes, createdAt: registration.createdAt,
    }
}

// Sin espejo — mismo criterio que useCommissionRoster(), es data de una sola pantalla (el detalle de
// una apertura), no la necesita nadie más.
export function useEnrollmentRegistrations(openingId: string | undefined) {
    const { session } = useAuth()
    const organizationSlug = session?.organization.slug
    const query = useQuery({
        queryKey: ['enrollment-registrations', organizationSlug, openingId],
        queryFn: ({ signal }) => fetchEnrollmentRegistrations(organizationSlug!, openingId!, signal),
        enabled: Boolean(organizationSlug && openingId),
    })
    return { registrations: (query.data ?? []).map(fromApiRegistration), isLoading: query.isLoading, isError: query.isError }
}

export function useUpdateRegistrationNotes() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            return updateRegistrationNotesApi(organizationSlug, id, notes)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enrollment-registrations', organizationSlug] }),
    })
}

export function useConfirmRegistration() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async (id: string) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            return confirmRegistrationApi(organizationSlug, id)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enrollment-registrations', organizationSlug] }),
    })
}

function fromApiPublicOffer(offer: Awaited<ReturnType<typeof fetchPublicOffer>>): PublicEnrollmentOffer {
    return {
        slug: offer.slug, openingId: offer.openingId, courseId: offer.courseId, courseName: offer.courseName, amount: offer.amount,
        status: openingStatusFromApi(offer.status), startDate: offer.startDate, endDate: offer.endDate,
        commissions: offer.commissions.map((commission) => ({
            id: commission.id, name: commission.name, schedule: commission.schedule, amount: commission.amount,
            capacity: commission.capacity, occupied: commission.occupied, startDate: commission.startDate, endDate: commission.endDate,
        })),
    }
}

// Público, sin sesión — mismo cliente publicRequest que ya usa LoginPage.tsx para /public/.../context.
export function usePublicOffer(organizationSlug: string | undefined, slug: string | undefined) {
    const query = useQuery({
        queryKey: ['public-enrollment-offer', organizationSlug, slug],
        queryFn: ({ signal }) => fetchPublicOffer(organizationSlug!, slug!, signal),
        enabled: Boolean(organizationSlug && slug),
        retry: false,
    })
    return { offer: query.data ? fromApiPublicOffer(query.data) : undefined, isLoading: query.isLoading, isError: query.isError }
}

export function getPublicEnrollmentAvailability(offer: PublicEnrollmentOffer | undefined, commissionId?: string, date = getLocalDateString()) {
    const candidates = offer ? (commissionId ? offer.commissions.filter((commission) => commission.id === commissionId) : offer.commissions) : []
    const hasCapacity = candidates.some((commission) => commission.occupied < commission.capacity)
    return resolveEnrollmentAvailability({
        exists: Boolean(offer),
        status: offer?.status,
        date,
        startDate: offer?.startDate,
        endDate: offer?.endDate,
        commissionCount: offer?.commissions.length ?? 0,
        commissionSelected: Boolean(commissionId),
        selectedCommissionExists: candidates.length > 0,
        hasCapacity,
    })
}

export function useRegisterPublicly() {
    return useMutation({
        mutationFn: async ({ organizationSlug, slug, input }: { organizationSlug: string; slug: string; input: ApiPublicRegistrationInput }) => {
            return registerPubliclyApi(organizationSlug, slug, input)
        },
    })
}
