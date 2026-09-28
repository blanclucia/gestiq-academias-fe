import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/AuthContext'
import { getSelectedBranchId } from '@/services/branchRepository'
import {
    activateAcademicCycleApi, createAcademicCycleApi, createCourseApi, deleteCourseApi, fetchAcademicCycles, fetchCourses, updateCourseApi,
    type ApiCommission, type ApiCourse, type ApiCourseInput, type ApiCoursePatch, type ApiCycle, type ApiCycleInput,
} from '@/services/organization/academicOffersApi'
import { commissionStatusFromApi, courseStatusFromApi, courseStatusToApi, cycleStatusFromApi, cycleStatusToApi } from '@/services/organization/academicOffersMapping'
import { readAcademyState, updateAcademyState } from './academyState'
import type { AcademicCommission, AcademicCourse, AcademicCycle } from './academyTypes'

function fromApiCommission(commission: ApiCommission): AcademicCommission {
    return {
        id: commission.id,
        name: commission.name,
        teacher: commission.teachers[0] ?? 'Docente por asignar',
        teachers: commission.teachers,
        schedule: commission.schedule,
        studentsCount: commission.studentsCount,
        capacity: commission.capacity,
        amount: commission.amount,
        startDate: commission.startDate,
        endDate: commission.endDate,
        dueDay: commission.dueDay,
        status: commissionStatusFromApi(commission.status),
    }
}

function fromApiCourse(course: ApiCourse): AcademicCourse {
    return {
        id: course.id,
        branchId: course.branchId,
        cycleId: course.cycleId,
        name: course.name,
        description: course.description || undefined,
        studentsCount: course.studentsCount,
        status: courseStatusFromApi(course.status),
        commissions: course.commissions.map(fromApiCommission),
    }
}

function fromApiCycle(cycle: ApiCycle): AcademicCycle {
    return { id: cycle.id, name: cycle.name, startDate: cycle.startDate, endDate: cycle.endDate, status: cycleStatusFromApi(cycle.status) }
}

function sameCourseMirror(current: AcademicCourse[], next: AcademicCourse[]): boolean {
    return JSON.stringify(current) === JSON.stringify(next)
}
function sameCycleMirror(current: AcademicCycle[], next: AcademicCycle[], currentActiveId: string, nextActiveId: string): boolean {
    return currentActiveId === nextActiveId && JSON.stringify(current) === JSON.stringify(next)
}

// listCourses()/listAcademicCycles()/getActiveAcademicCycleId() stay synchronous because ~10 other
// modules (billing, agenda, dashboard, students, mi academia) read them outside React. They read a
// local mirror of the real backend, kept warm by useCourses()/useAcademicCycles() + <AcademicOffersSync>.
export function listCourses(): AcademicCourse[] {
    return readAcademyState().courses
}

export function listAcademicCycles(): AcademicCycle[] {
    return readAcademyState().cycles
}

export function getActiveAcademicCycleId(): string {
    return readAcademyState().activeCycleId
}

export function useCourses(options: { enabled?: boolean } = {}) {
    const { session } = useAuth()
    const organizationSlug = session?.organization.slug
    const query = useQuery({
        queryKey: ['courses', organizationSlug],
        queryFn: ({ signal }) => fetchCourses(organizationSlug!, signal),
        enabled: Boolean(organizationSlug) && (options.enabled ?? true),
    })
    useEffect(() => {
        if (!query.data) return
        const mapped = query.data.map(fromApiCourse)
        if (!sameCourseMirror(readAcademyState().courses, mapped)) {
            updateAcademyState((current) => ({ ...current, courses: mapped }))
        }
    }, [query.data])
    return { courses: listCourses(), isLoading: query.isLoading, isError: query.isError, error: query.error }
}

export function useAcademicCycles(options: { enabled?: boolean } = {}) {
    const { session } = useAuth()
    const organizationSlug = session?.organization.slug
    const query = useQuery({
        queryKey: ['academic-cycles', organizationSlug],
        queryFn: ({ signal }) => fetchAcademicCycles(organizationSlug!, signal),
        enabled: Boolean(organizationSlug) && (options.enabled ?? true),
    })
    useEffect(() => {
        if (!query.data) return
        const mapped = query.data.map(fromApiCycle)
        const activeId = query.data.find((cycle) => cycle.active)?.id ?? ''
        const state = readAcademyState()
        if (!sameCycleMirror(state.cycles, mapped, state.activeCycleId, activeId)) {
            updateAcademyState((current) => ({ ...current, cycles: mapped, activeCycleId: activeId }))
        }
    }, [query.data])
    return { cycles: listAcademicCycles(), activeCycleId: getActiveAcademicCycleId(), isLoading: query.isLoading, isError: query.isError, error: query.error }
}

export function useCreateCycle() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async (form: { name: string; startDate: string; endDate: string; status: 'Borrador' | 'Activo' | 'Cerrado' }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            const input: ApiCycleInput = { name: form.name, startDate: form.startDate, endDate: form.endDate, status: cycleStatusToApi(form.status) }
            return createAcademicCycleApi(organizationSlug, input)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['academic-cycles', organizationSlug] }),
    })
}

export function useActivateCycle() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async (cycleId: string) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            await activateAcademicCycleApi(organizationSlug, cycleId)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['academic-cycles', organizationSlug] }),
    })
}

function toApiCourseInput(form: { name: string; description?: string; status: 'Activo' | 'Borrador' | 'Cerrado' }, cycleId: string, branchId: string): ApiCourseInput {
    return { branchId, cycleId, name: form.name, description: form.description ?? '', status: courseStatusToApi(form.status) }
}

export function useCreateCourse() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async ({ form, cycleId }: { form: Parameters<typeof toApiCourseInput>[0]; cycleId: string }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            const branchId = getSelectedBranchId()
            if (!branchId) throw new Error('Elegí una sede en la barra superior antes de crear un curso.')
            return createCourseApi(organizationSlug, toApiCourseInput(form, cycleId, branchId))
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses', organizationSlug] }),
    })
}

export function useUpdateCourse() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async ({ id, changes }: { id: string; changes: Partial<{ name: string; description: string; status: 'Activo' | 'Borrador' | 'Cerrado' }> }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            const patch: ApiCoursePatch = {}
            if (changes.name !== undefined) patch.name = changes.name
            if (changes.description !== undefined) patch.description = changes.description
            if (changes.status !== undefined) patch.status = courseStatusToApi(changes.status)
            return updateCourseApi(organizationSlug, id, patch)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses', organizationSlug] }),
    })
}

export function useDeleteCourse() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async (id: string) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            await deleteCourseApi(organizationSlug, id)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses', organizationSlug] }),
    })
}
