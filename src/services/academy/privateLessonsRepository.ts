import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/AuthContext'
import { createPrivateLessonApi, deletePrivateLessonApi, fetchPrivateLessons, updatePrivateLessonApi, type ApiPrivateLesson, type ApiPrivateLessonCreate, type ApiPrivateLessonPatch } from '@/services/organization/privateLessonsApi'
import { privateLessonPlanFromApi, privateLessonPlanToApi, privateLessonStatusFromApi, privateLessonStatusToApi } from '@/services/organization/privateLessonsMapping'
import { readAcademyState, updateAcademyState } from './academyState'
import type { PrivateLesson } from './academyTypes'

function fromApiPrivateLesson(lesson: ApiPrivateLesson): PrivateLesson {
    return {
        id: lesson.id,
        studentId: lesson.studentId,
        teacherId: lesson.teacherId,
        purpose: lesson.purpose,
        plan: privateLessonPlanFromApi(lesson.plan),
        startDate: lesson.startDate,
        endDate: lesson.endDate,
        costPerClass: lesson.costPerClass,
        days: lesson.days,
        fromTime: lesson.fromTime,
        toTime: lesson.toTime,
        status: privateLessonStatusFromApi(lesson.status),
    }
}

function sameMirror(current: PrivateLesson[], next: PrivateLesson[]): boolean {
    return JSON.stringify(current) === JSON.stringify(next)
}

// listPrivateLessons() stays synchronous — AcademicOffersPage reads it outside a data-fetching
// lifecycle, same pattern as listStaff()/listStudents(). It reads the local mirror kept warm by
// usePrivateLessons()/<PrivateLessonsSync>, no longer seeded with initialPrivateLessons.
export function listPrivateLessons(): PrivateLesson[] {
    return readAcademyState().privateLessons
}

export function usePrivateLessons(options: { enabled?: boolean } = {}) {
    const { session } = useAuth()
    const organizationSlug = session?.organization.slug
    const query = useQuery({
        queryKey: ['private-lessons', organizationSlug],
        queryFn: ({ signal }) => fetchPrivateLessons(organizationSlug!, {}, signal),
        enabled: Boolean(organizationSlug) && (options.enabled ?? true),
    })
    useEffect(() => {
        if (!query.data) return
        const mapped = query.data.map(fromApiPrivateLesson)
        if (!sameMirror(readAcademyState().privateLessons, mapped)) {
            updateAcademyState((current) => ({ ...current, privateLessons: mapped }))
        }
    }, [query.data])
    return { lessons: listPrivateLessons(), isLoading: query.isLoading, isError: query.isError }
}

// The backend creates the lesson's charges in the same transaction (one per month for the monthly
// plan, a single one for a class or pack), so Cobros refreshes too.
export function useCreatePrivateLesson() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async (input: Omit<PrivateLesson, 'id' | 'status'>) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            const payload: ApiPrivateLessonCreate = {
                studentId: input.studentId, teacherId: input.teacherId, purpose: input.purpose,
                plan: privateLessonPlanToApi(input.plan), costPerClass: input.costPerClass,
                startDate: input.startDate, endDate: input.endDate, days: input.days,
                fromTime: input.fromTime, toTime: input.toTime,
            }
            return fromApiPrivateLesson(await createPrivateLessonApi(organizationSlug, payload))
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['private-lessons', organizationSlug] })
            void queryClient.invalidateQueries({ queryKey: ['charges', organizationSlug] })
        },
    })
}

// Covers both "Reprogramar" (editing schedule/plan/price) and "Cancelar" (status:'Finalizada'). The
// backend adjusts the charges: cancelling removes the unpaid upcoming ones, rescheduling replaces
// them with the new schedule's (the months already charged stay).
export function useUpdatePrivateLesson() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async ({ id, changes }: { id: string; changes: Partial<Omit<PrivateLesson, 'id' | 'studentId' | 'teacherId'>> }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            const patch: ApiPrivateLessonPatch = {}
            if (changes.purpose !== undefined) patch.purpose = changes.purpose
            if (changes.plan !== undefined) patch.plan = privateLessonPlanToApi(changes.plan)
            if (changes.costPerClass !== undefined) patch.costPerClass = changes.costPerClass
            if (changes.startDate !== undefined) patch.startDate = changes.startDate
            if (changes.endDate !== undefined) patch.endDate = changes.endDate
            if (changes.days !== undefined) patch.days = changes.days
            if (changes.fromTime !== undefined) patch.fromTime = changes.fromTime
            if (changes.toTime !== undefined) patch.toTime = changes.toTime
            if (changes.status !== undefined) patch.status = privateLessonStatusToApi(changes.status)
            return updatePrivateLessonApi(organizationSlug, id, patch)
        },
        // Cancelling or rescheduling changes the lesson's charges backend-side.
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['private-lessons', organizationSlug] })
            void queryClient.invalidateQueries({ queryKey: ['charges', organizationSlug] })
        },
    })
}

// Removes a lesson created by mistake with its unpaid charges.
export function useDeletePrivateLesson() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async (id: string) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            await deletePrivateLessonApi(organizationSlug, id)
            updateAcademyState((current) => ({ ...current, privateLessons: current.privateLessons.filter((lesson) => lesson.id !== id) }))
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['private-lessons', organizationSlug] })
            void queryClient.invalidateQueries({ queryKey: ['charges', organizationSlug] })
        },
    })
}
