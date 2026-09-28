import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/AuthContext'
import { createChargeApi } from '@/services/organization/chargesApi'
import { createPrivateLessonApi, fetchPrivateLessons, updatePrivateLessonApi, type ApiPrivateLesson, type ApiPrivateLessonCreate, type ApiPrivateLessonPatch } from '@/services/organization/privateLessonsApi'
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

function planClassCount(plan: string): number {
    return plan === 'Pack 4 clases' ? 4 : plan === 'Pack 8 clases' ? 8 : plan === 'Pack 12 clases' ? 12 : 1
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

// Creating a private lesson also creates a real manual charge in Facturación for it (source=manual),
// replacing what the old mock payment source (`privateLessonPayments`) used to synthesize on the fly
// — with a real dueDate (the lesson's own startDate) instead of the hardcoded stale one it used to
// have. If the charge fails to create, the lesson itself is not rolled back — same criteria already
// used for "enrolling + generating tuition" in Comisiones. The caller finds out via `chargeFailed` on
// the result and is responsible for surfacing it (this repository layer doesn't own toasts).
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
            const created = await createPrivateLessonApi(organizationSlug, payload)
            const amount = input.plan === 'Plan mensual' ? input.costPerClass : input.costPerClass * planClassCount(input.plan)
            let chargeFailed = false
            try {
                await createChargeApi(organizationSlug, {
                    studentId: input.studentId, concept: `Clases particulares · ${input.plan}`,
                    amount, dueDate: input.startDate, notes: '',
                })
            } catch {
                chargeFailed = true
            }
            return { lesson: fromApiPrivateLesson(created), chargeFailed }
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['private-lessons', organizationSlug] })
            void queryClient.invalidateQueries({ queryKey: ['charges', organizationSlug] })
        },
    })
}

// Covers both "Reprogramar" (editing schedule/plan/price) and "Cancelar" (status:'Finalizada').
// Does not regenerate or adjust the charge already created at lesson creation — same limitation
// already accepted for editing a commission not retroactively rewriting already-generated tuition.
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
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['private-lessons', organizationSlug] }),
    })
}
