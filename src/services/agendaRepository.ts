import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/AuthContext'
import { getActiveAcademicCycleId, listCourses, listEnrollmentOpenings, listPrivateLessons, listStaff, listStudents } from '@/services/academyRepository'
import { createAgendaEventApi, deleteAgendaEventApi, fetchAgendaEvents, updateAgendaEventApi, type ApiAgendaEvent, type ApiAgendaEventInput, type ApiAgendaList } from '@/services/organization/agendaApi'
import { getWeeklyAgendaDates, isAgendaEventInBranch, type AgendaBranchScope } from '@/domain/agenda/agendaRules'

export type AgendaEventType = 'feriado' | 'cumpleanos' | 'clase' | 'inscripcion' | 'academico' | 'reunion' | 'recordatorio' | 'otro'
export type AgendaEventScope = 'general' | 'commission'

export type AgendaEvent = {
    id: string
    title: string
    description?: string
    type: AgendaEventType
    scope: AgendaEventScope
    commissionId?: string
    date: string
    endDate?: string
    allDay: boolean
    location?: string
    startTime?: string
    endTime?: string
    source: 'system' | 'admin' | 'teacher'
    createdAt: string
    // Sede a la que pertenece el evento; sin valor aplica a toda la academia (feriados, eventos generales).
    branchId?: string
    // Cumpleaños de staff: un docente puede estar en varias sedes, así que se resuelve contra el roster de cada una.
    staffUserId?: string
}

// Events used to live in the browser (this key). They were test data only seen by whoever created
// them; the agenda now reads the backend, so the old copy is just removed.
const legacyStorageKey = 'gestiq-agenda-events-v1'
function discardLegacyEvents() {
    try {
        window.localStorage.removeItem(legacyStorageKey)
    } catch {
        // Storage may be unavailable (private mode): nothing to discard.
    }
}

function dateForBirthday(birthDate: string, year: number) {
    const [, month, day] = birthDate.split('-')
    return month && day ? `${year}-${month}-${day}` : ''
}

function derivedBirthdayEvents(year: number): AgendaEvent[] {
    const students = listStudents().filter((student) => student.birthDate)
    const teachers = listStaff().filter((teacher) => teacher.birthDate)
    return [
        ...students.map((student) => ({ id: `BIRTHDAY-ST-${student.id}-${year}`, title: `Cumpleaños · ${student.fullName}`, type: 'cumpleanos' as const, scope: 'general' as const, date: dateForBirthday(student.birthDate!, year), allDay: true, source: 'system' as const, createdAt: `${year}-01-01`, branchId: student.branchId, personId: student.id, personType: 'student' as const })),
        ...teachers.map((teacher) => ({ id: `BIRTHDAY-T-${teacher.id}-${year}`, title: `Cumpleaños · ${teacher.fullName}`, type: 'cumpleanos' as const, scope: 'general' as const, date: dateForBirthday(teacher.birthDate!, year), allDay: true, source: 'system' as const, createdAt: `${year}-01-01`, staffUserId: teacher.userId, personId: teacher.id, personType: 'teacher' as const })),
    ].filter((event) => event.date)
}

const weekdayByShortName: Record<string, number> = { lun: 1, mar: 2, mié: 3, mie: 3, jue: 4, vie: 5, sáb: 6, sab: 6, dom: 0 }

function parseSchedule(schedule: string) {
    const [daysPart, timePart] = schedule.split('·').map((value) => value.trim())
    const times = timePart?.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/)
    const weekdays = (daysPart ?? '').split('/').map((day) => weekdayByShortName[day.trim().toLowerCase()]).filter((day): day is number => day !== undefined)
    return { weekdays, startTime: times?.[1], endTime: times?.[2] }
}

function derivedClassEvents(year: number): AgendaEvent[] {
    // Same scoping as Ofertas académicas: only the active ciclo lectivo's courses show up here —
    // a course from a past/inactive cycle shouldn't keep generating class chips on the calendar.
    const activeCycleId = getActiveAcademicCycleId()
    const courses = listCourses().filter((course) => course.cycleId === activeCycleId)
    const commissionEvents = courses.flatMap((course) => course.commissions.flatMap((commission) => {
        const schedule = parseSchedule(commission.schedule)
        return getWeeklyAgendaDates(commission.startDate, commission.endDate, schedule.weekdays, year).map((date) => ({
            id: `CLASS-${commission.id}-${date}`,
            title: `${course.name} · ${commission.name}`,
            description: `${commission.teachers.join(', ') || 'Docente a confirmar'} · ${commission.schedule}`,
            type: 'clase' as const,
            scope: 'commission' as const,
            commissionId: commission.id,
            branchId: course.branchId,
            date,
            allDay: false,
            source: 'system' as const,
            createdAt: `${year}-01-01`,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
        }))
    }))
    const teachersById = new Map(listStaff().map((teacher) => [teacher.id, teacher]))
    const privateEvents = listPrivateLessons().flatMap((lesson) => getWeeklyAgendaDates(lesson.startDate, lesson.endDate, lesson.days.map((day) => weekdayByShortName[day.slice(0, 3).toLowerCase()]).filter((day): day is number => day !== undefined), year).map((date) => ({
        id: `PRIVATE-${lesson.id}-${date}`,
        title: `Particular · ${teachersById.get(lesson.teacherId)?.fullName ?? 'Docente no encontrado'}`,
        description: `${lesson.purpose} · ${lesson.fromTime}-${lesson.toTime}`,
        type: 'clase' as const,
        scope: 'general' as const,
        date,
        allDay: false,
        source: 'system' as const,
        createdAt: `${year}-01-01`,
        startTime: lesson.fromTime,
        endTime: lesson.toTime,
    })))
    return [...commissionEvents, ...privateEvents]
}

function derivedEnrollmentEvents(year: number): AgendaEvent[] {
    // Same scoping as derivedClassEvents above: an opening for a course outside the active ciclo
    // lectivo shouldn't keep showing "Inscripciones abiertas" on the calendar.
    const activeCycleId = getActiveAcademicCycleId()
    const coursesById = new Map(listCourses().filter((course) => course.cycleId === activeCycleId).map((course) => [course.id, course]))
    return listEnrollmentOpenings().filter((opening) => opening.startDate.startsWith(`${year}-`) && coursesById.has(opening.courseId)).flatMap((opening) => {
        const course = coursesById.get(opening.courseId)
        return [{ id: `ENROLLMENT-OPEN-${opening.id}`, title: `Inscripciones abiertas · ${course?.name ?? 'Oferta académica'}`, type: 'inscripcion' as const, scope: 'general' as const, branchId: course?.branchId, date: opening.startDate, endDate: opening.endDate, allDay: true, source: 'system' as const, createdAt: `${year}-01-01` }]
    })
}

function fromApiEvent(event: ApiAgendaEvent): AgendaEvent {
    return {
        id: event.id, title: event.title, description: event.description || undefined, type: event.type, scope: 'general',
        date: event.date, endDate: event.endDate !== event.date ? event.endDate : undefined, allDay: event.allDay,
        location: event.location || undefined, startTime: event.startTime || undefined, endTime: event.endTime || undefined,
        source: 'admin', createdAt: '', branchId: event.branchId ?? undefined,
    }
}

function holidayEvents(holidays: ApiAgendaList['holidays']): AgendaEvent[] {
    return holidays.map((holiday) => ({ id: `HOL-${holiday.date}-${holiday.title}`, title: holiday.title, type: 'feriado', scope: 'general', date: holiday.date, allDay: true, source: 'system', createdAt: '' }))
}

// Commission exams are managed from the commission; the agenda only shows their date.
function examEvents(exams: ApiAgendaList['exams']): AgendaEvent[] {
    return exams.map((exam) => ({ id: `EXAM-${exam.examId}`, title: `Examen · ${exam.title} · ${exam.courseName} ${exam.commissionName}`, type: 'academico', scope: 'commission', commissionId: exam.commissionId, branchId: exam.branchId, date: exam.date, allDay: true, source: 'system', createdAt: '' }))
}

const yearsBetween = (from: string, to: string) => {
    const years: number[] = []
    for (let year = Number(from.slice(0, 4)); year <= Number(to.slice(0, 4)); year += 1) years.push(year)
    return years
}

// Every event of the range for a branch: the academy's own events and the national holidays from the
// backend, plus classes, enrollment openings and birthdays derived from their modules. Derived ones
// are filtered with the same branch rule the dashboard uses.
export function useAgendaEvents(range: { from: string; to: string }, branchScope?: AgendaBranchScope) {
    const { session } = useAuth()
    const organizationSlug = session?.organization.slug
    const query = useQuery({
        queryKey: ['agenda-events', organizationSlug, range.from, range.to, branchScope?.branchId ?? ''],
        queryFn: ({ signal }) => {
            discardLegacyEvents()
            return fetchAgendaEvents(organizationSlug!, { from: range.from, to: range.to, branchId: branchScope?.branchId || undefined }, signal)
        },
        enabled: Boolean(organizationSlug),
    })
    const commissionBranchIds = new Map(listCourses().flatMap((course) => course.commissions.map((commission) => [commission.id, course.branchId] as const)))
    const derived = yearsBetween(range.from, range.to).flatMap((year) => [...derivedBirthdayEvents(year), ...derivedClassEvents(year), ...derivedEnrollmentEvents(year)])
        .filter((event) => !branchScope?.branchId || isAgendaEventInBranch(event, branchScope, commissionBranchIds))
    const stored = query.data ? [...holidayEvents(query.data.holidays), ...examEvents(query.data.exams), ...query.data.items.map(fromApiEvent)] : []
    const events = [...stored, ...derived]
        .filter((event) => event.date <= range.to && (event.endDate ?? event.date) >= range.from)
        .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime ?? '').localeCompare(b.startTime ?? ''))
    return { events, isLoading: query.isLoading, isError: query.isError }
}

export type AgendaEventInput = Omit<ApiAgendaEventInput, 'branchId'> & { branchId?: string }

const toApiInput = (input: AgendaEventInput): ApiAgendaEventInput => ({ ...input, branchId: input.branchId ?? null })

function useAgendaInvalidation() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return { organizationSlug, invalidate: () => queryClient.invalidateQueries({ queryKey: ['agenda-events', organizationSlug] }) }
}

// A weekly series is expanded by the backend into one event per matching day.
export function useCreateAgendaEvent() {
    const { organizationSlug, invalidate } = useAgendaInvalidation()
    return useMutation({
        mutationFn: async ({ input, recurrence }: { input: AgendaEventInput; recurrence?: { weekdays: number[]; repeatUntil: string } }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            return createAgendaEventApi(organizationSlug, { ...toApiInput(input), ...(recurrence ? { recurrence } : {}) })
        },
        onSuccess: invalidate,
    })
}

export function useUpdateAgendaEvent() {
    const { organizationSlug, invalidate } = useAgendaInvalidation()
    return useMutation({
        mutationFn: async ({ id, input }: { id: string; input: AgendaEventInput }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            return updateAgendaEventApi(organizationSlug, id, toApiInput(input))
        },
        onSuccess: invalidate,
    })
}

export function useDeleteAgendaEvent() {
    const { organizationSlug, invalidate } = useAgendaInvalidation()
    return useMutation({
        mutationFn: async (id: string) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            await deleteAgendaEventApi(organizationSlug, id)
        },
        onSuccess: invalidate,
    })
}
