import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/AuthContext'
import { getSelectedBranchId } from '@/services/branchRepository'
import { createStudentApi, deleteStudentApi, fetchStudentEnrollments, fetchStudents, updateStudentApi, type ApiStudent, type ApiStudentInput, type ApiStudentPatch } from '@/services/organization/studentsApi'
import { studentStatusFromApi, studentStatusToApi } from '@/services/organization/studentsMapping'
import { enrollmentStatusFromApi } from '@/services/organization/academicOffersMapping'
import type { Student } from '@/types/domain'
import type { CommissionStudentStatus } from './academyTypes'
import { readAcademyState, updateAcademyState } from './academyState'

function fromApiStudent(student: ApiStudent): Student {
    return {
        id: student.id,
        branchId: student.branchId,
        firstName: student.firstName,
        lastName: student.lastName,
        fullName: student.fullName,
        email: student.email,
        phone: student.phone,
        document: student.document,
        birthDate: student.birthDate || undefined,
        tutorName: student.tutorName || undefined,
        tutorEmail: student.tutorEmail || undefined,
        tutorPhone: student.tutorPhone || undefined,
        notes: student.notes || undefined,
        status: studentStatusFromApi(student.status),
        courses: [],
    }
}

function sameMirror(current: Student[], next: Student[]): boolean {
    if (current.length !== next.length) return false
    return current.every((student, index) => {
        const other = next[index]
        return other !== undefined && student.id === other.id && student.status === other.status && student.fullName === other.fullName
            && student.email === other.email && student.phone === other.phone && student.document === other.document
    })
}

// listStudents() stays synchronous because ~10 other modules (billing, agenda, dashboard,
// commissions, exams, academic offers) read it outside React, without awaiting anything. It reads
// a local mirror of the real backend list (kept warm by useStudents()/<StudentsSync>) instead of
// the old local-only students — real backend is now the source of truth, this is just a cache.
// student.courses is always [] here: which commissions a student is in is now resolved from the
// real roster (useCommissionRoster per commission, useStudentEnrollments for a student's full
// history) — not merged in locally anymore, since the local "assignments" mechanism that used to
// fill it never touched the real backend and is gone.
export function listStudents(): Student[] {
    return readAcademyState().students
}

export function useStudents(options: { enabled?: boolean } = {}) {
    const { session } = useAuth()
    const organizationSlug = session?.organization.slug
    const query = useQuery({
        queryKey: ['students', organizationSlug],
        queryFn: ({ signal }) => fetchStudents(organizationSlug!, signal),
        enabled: Boolean(organizationSlug) && (options.enabled ?? true),
    })
    useEffect(() => {
        if (!query.data) return
        const mapped = query.data.map(fromApiStudent)
        if (!sameMirror(readAcademyState().students, mapped)) {
            updateAcademyState((current) => ({ ...current, students: mapped }))
        }
    }, [query.data])
    return { students: listStudents(), isLoading: query.isLoading, isError: query.isError, error: query.error }
}

function toApiInput(form: { firstName: string; lastName: string; document: string; email: string; phone: string; birthDate?: string; notes?: string; status: 'Activo' | 'Pendiente' | 'Inactivo' }, branchId: string): ApiStudentInput {
    return {
        branchId, firstName: form.firstName, lastName: form.lastName, document: form.document, email: form.email, phone: form.phone,
        birthDate: form.birthDate ?? '', notes: form.notes ?? '', status: studentStatusToApi(form.status),
    }
}

export function useCreateStudent() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async (form: Parameters<typeof toApiInput>[0]) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            const branchId = getSelectedBranchId()
            if (!branchId) throw new Error('Elegí una sede en la barra superior antes de crear un alumno.')
            return createStudentApi(organizationSlug, toApiInput(form, branchId))
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students', organizationSlug] }),
    })
}

export function useUpdateStudent() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async ({ id, changes }: { id: string; changes: Partial<Parameters<typeof toApiInput>[0]> }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            const patch: ApiStudentPatch = {}
            if (changes.firstName !== undefined) patch.firstName = changes.firstName
            if (changes.lastName !== undefined) patch.lastName = changes.lastName
            if (changes.document !== undefined) patch.document = changes.document
            if (changes.email !== undefined) patch.email = changes.email
            if (changes.phone !== undefined) patch.phone = changes.phone
            if (changes.birthDate !== undefined) patch.birthDate = changes.birthDate
            if (changes.notes !== undefined) patch.notes = changes.notes
            if (changes.status !== undefined) patch.status = studentStatusToApi(changes.status)
            return updateStudentApi(organizationSlug, id, patch)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students', organizationSlug] }),
    })
}

export function useDeleteStudent() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async (id: string) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            await deleteStudentApi(organizationSlug, id)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students', organizationSlug] }),
    })
}

export type StudentEnrollmentHistoryRow = { id: string; courseId: string; courseName: string; commissionId: string; commissionName: string; startDate: string; endDate: string; status: CommissionStudentStatus; enrolledAt: string }

// The student's full enrollment history across every commission/course/cycle — unlike
// listStudents()'s "vigente"-scoped data elsewhere, this is intentionally unfiltered (no espejo:
// fetched on demand, same criterion as useCommissionRoster).
export function useStudentEnrollments(studentId: string | undefined) {
    const { session } = useAuth()
    const organizationSlug = session?.organization.slug
    const query = useQuery({
        queryKey: ['student-enrollments', organizationSlug, studentId],
        queryFn: ({ signal }) => fetchStudentEnrollments(organizationSlug!, studentId!, signal),
        enabled: Boolean(organizationSlug && studentId),
    })
    const history: StudentEnrollmentHistoryRow[] = (query.data ?? []).map((item) => ({
        id: item.commissionId,
        courseId: item.courseId,
        courseName: item.courseName,
        commissionId: item.commissionId,
        commissionName: item.commissionName,
        startDate: item.startDate,
        endDate: item.endDate,
        status: enrollmentStatusFromApi(item.status),
        enrolledAt: item.enrolledAt,
    })).sort((a, b) => b.startDate.localeCompare(a.startDate))
    return { history, isLoading: query.isLoading, isError: query.isError }
}
