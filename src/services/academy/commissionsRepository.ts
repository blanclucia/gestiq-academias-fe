import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/AuthContext'
import { listPayments } from '@/services/billing/paymentsRepository'
import {
    assignEnrollmentApi, createCommissionApi, deleteCommissionApi, fetchCommissionRoster, revokeEnrollmentApi, updateCommissionApi,
    type ApiCommissionInput, type ApiCommissionPatch,
} from '@/services/organization/academicOffersApi'
import { commissionStatusToApi, enrollmentStatusFromApi, enrollmentStatusToApi } from '@/services/organization/academicOffersMapping'
import { studentStatusFromApi } from '@/services/organization/studentsMapping'
import { listEnrollmentOpenings } from './enrollmentsRepository'
import type { AcademicCommission, CommissionStudentStatus } from './academyTypes'
import { listCourses } from './coursesRepository'

export function getCourseRemovalBlockers(id: string) {
    const course = listCourses().find((item) => item.id === id)
    if (!course) return []
    const students = course.commissions.reduce((total, commission) => total + commission.studentsCount, 0)
    const openings = listEnrollmentOpenings(course.id).length
    const payments = listPayments().filter((payment) => payment.concept.includes(course.name) && payment.status !== 'Pagado').length
    return [students ? `${students} alumno${students === 1 ? '' : 's'} asignado${students === 1 ? '' : 's'}` : '', openings ? `${openings} inscripción${openings === 1 ? '' : 'es'} registrada${openings === 1 ? '' : 's'}` : '', payments ? `${payments} pago${payments === 1 ? '' : 's'} pendiente${payments === 1 ? '' : 's'}` : ''].filter(Boolean)
}

export function getCommissionRemovalBlockers(courseId: string, commissionId: string) {
    const course = listCourses().find((item) => item.id === courseId)
    const commission = course?.commissions.find((item) => item.id === commissionId)
    if (!course || !commission) return []
    const students = commission.studentsCount
    const openings = listEnrollmentOpenings(course.id).length
    const payments = listPayments().filter((payment) => payment.concept.includes(commission.name) && payment.status !== 'Pagado').length
    return [students ? `${students} alumno${students === 1 ? '' : 's'} asignado${students === 1 ? '' : 's'}` : '', openings ? `${openings} inscripción${openings === 1 ? '' : 'es'} registrada${openings === 1 ? '' : 's'}` : '', payments ? `${payments} pago${payments === 1 ? '' : 's'} pendiente${payments === 1 ? '' : 's'}` : ''].filter(Boolean)
}

function toApiCommissionInput(commission: Omit<AcademicCommission, 'id' | 'studentsCount'>): ApiCommissionInput {
    return {
        name: commission.name, teachers: commission.teachers, schedule: commission.schedule, capacity: commission.capacity, amount: commission.amount,
        startDate: commission.startDate, endDate: commission.endDate, dueDay: commission.dueDay, status: commissionStatusToApi(commission.status),
    }
}

export function useCreateCommission() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async ({ courseId, commission }: { courseId: string; commission: Omit<AcademicCommission, 'id' | 'studentsCount'> }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            return createCommissionApi(organizationSlug, courseId, toApiCommissionInput(commission))
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses', organizationSlug] }),
    })
}

export function useUpdateCommission() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async ({ courseId, commissionId, changes }: { courseId: string; commissionId: string; changes: Partial<Omit<AcademicCommission, 'id' | 'studentsCount'>> }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            const patch: ApiCommissionPatch = {}
            if (changes.name !== undefined) patch.name = changes.name
            if (changes.teachers !== undefined) patch.teachers = changes.teachers
            if (changes.schedule !== undefined) patch.schedule = changes.schedule
            if (changes.capacity !== undefined) patch.capacity = changes.capacity
            if (changes.amount !== undefined) patch.amount = changes.amount
            if (changes.startDate !== undefined) patch.startDate = changes.startDate
            if (changes.endDate !== undefined) patch.endDate = changes.endDate
            if (changes.dueDay !== undefined) patch.dueDay = changes.dueDay
            if (changes.status !== undefined) patch.status = commissionStatusToApi(changes.status)
            return updateCommissionApi(organizationSlug, courseId, commissionId, patch)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses', organizationSlug] }),
    })
}

export function useDeleteCommission() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async ({ courseId, commissionId }: { courseId: string; commissionId: string }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            await deleteCommissionApi(organizationSlug, courseId, commissionId)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses', organizationSlug] }),
    })
}

export type CommissionRosterRow = { id: string; name: string; email: string; phone: string; status: CommissionStudentStatus; globalStatus: 'Activo' | 'Pendiente' | 'Inactivo' }

// Not mirrored globally (unlike students/courses) — this is single-screen data that nothing else
// in the app reads synchronously today.
export function useCommissionRoster(courseId?: string, commissionId?: string) {
    const { session } = useAuth()
    const organizationSlug = session?.organization.slug
    const query = useQuery({
        queryKey: ['commission-roster', organizationSlug, courseId, commissionId],
        queryFn: ({ signal }) => fetchCommissionRoster(organizationSlug!, courseId!, commissionId!, signal),
        enabled: Boolean(organizationSlug && courseId && commissionId),
    })
    const roster: CommissionRosterRow[] = (query.data ?? []).map((member) => ({
        id: member.studentId, name: member.fullName, email: member.email, phone: member.phone,
        status: enrollmentStatusFromApi(member.status), globalStatus: studentStatusFromApi(member.studentStatus),
    }))
    return { roster, isLoading: query.isLoading, isError: query.isError, error: query.error }
}

export function useAssignEnrollment() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async ({ courseId, commissionId, studentId, status }: { courseId: string; commissionId: string; studentId: string; status?: CommissionStudentStatus }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            await assignEnrollmentApi(organizationSlug, courseId, commissionId, studentId, status ? enrollmentStatusToApi(status) : undefined)
        },
        onSuccess: (_data, { courseId, commissionId }) => {
            queryClient.invalidateQueries({ queryKey: ['commission-roster', organizationSlug, courseId, commissionId] })
            queryClient.invalidateQueries({ queryKey: ['courses', organizationSlug] })
        },
    })
}

export function useRevokeEnrollment() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async ({ courseId, commissionId, studentId }: { courseId: string; commissionId: string; studentId: string }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            await revokeEnrollmentApi(organizationSlug, courseId, commissionId, studentId)
        },
        onSuccess: (_data, { courseId, commissionId }) => {
            queryClient.invalidateQueries({ queryKey: ['commission-roster', organizationSlug, courseId, commissionId] })
            queryClient.invalidateQueries({ queryKey: ['courses', organizationSlug] })
        },
    })
}
