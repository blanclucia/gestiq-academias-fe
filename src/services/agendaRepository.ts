import { useSyncExternalStore } from 'react'
import { listCourses, listEnrollmentOpenings, listPrivateLessons, listStaff, listStudents } from '@/services/academyRepository'
import { createRepositoryEvents } from '@/services/shared/repositoryEvents'
import { readStoredValue, writeStoredValue } from '@/services/shared/storage'
import { getWeeklyAgendaDates, shiftAgendaDate } from '@/domain/agenda/agendaRules'

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
}

const storageKey = 'gestiq-agenda-events-v1'
const repositoryEvents = createRepositoryEvents(storageKey)

const initialHolidays: AgendaEvent[] = [
    { id: 'HOL-2026-01-01', title: 'Año Nuevo', type: 'feriado', scope: 'general', date: '2026-01-01', allDay: true, source: 'system', createdAt: '2026-01-01' },
    { id: 'HOL-2026-02-16', title: 'Carnaval', type: 'feriado', scope: 'general', date: '2026-02-16', endDate: '2026-02-17', allDay: true, source: 'system', createdAt: '2026-01-01' },
    { id: 'HOL-2026-03-24', title: 'Día Nacional de la Memoria por la Verdad y la Justicia', type: 'feriado', scope: 'general', date: '2026-03-24', allDay: true, source: 'system', createdAt: '2026-01-01' },
    { id: 'HOL-2026-04-02', title: 'Día del Veterano y de los Caídos en la Guerra de Malvinas', type: 'feriado', scope: 'general', date: '2026-04-02', allDay: true, source: 'system', createdAt: '2026-01-01' },
    { id: 'HOL-2026-05-01', title: 'Día del Trabajador', type: 'feriado', scope: 'general', date: '2026-05-01', allDay: true, source: 'system', createdAt: '2026-01-01' },
    { id: 'HOL-2026-05-25', title: 'Día de la Revolución de Mayo', type: 'feriado', scope: 'general', date: '2026-05-25', allDay: true, source: 'system', createdAt: '2026-01-01' },
    { id: 'HOL-2026-06-20', title: 'Paso a la Inmortalidad del General Manuel Belgrano', type: 'feriado', scope: 'general', date: '2026-06-20', allDay: true, source: 'system', createdAt: '2026-01-01' },
    { id: 'HOL-2026-07-09', title: 'Día de la Independencia', type: 'feriado', scope: 'general', date: '2026-07-09', allDay: true, source: 'system', createdAt: '2026-01-01' },
    { id: 'HOL-2026-08-17', title: 'Paso a la Inmortalidad del General José de San Martín', type: 'feriado', scope: 'general', date: '2026-08-17', allDay: true, source: 'system', createdAt: '2026-01-01' },
    { id: 'HOL-2026-10-12', title: 'Día del Respeto a la Diversidad Cultural', type: 'feriado', scope: 'general', date: '2026-10-12', allDay: true, source: 'system', createdAt: '2026-01-01' },
    { id: 'HOL-2026-11-20', title: 'Día de la Soberanía Nacional', type: 'feriado', scope: 'general', date: '2026-11-20', allDay: true, source: 'system', createdAt: '2026-01-01' },
    { id: 'HOL-2026-12-08', title: 'Inmaculada Concepción de María', type: 'feriado', scope: 'general', date: '2026-12-08', allDay: true, source: 'system', createdAt: '2026-01-01' },
    { id: 'HOL-2026-12-25', title: 'Navidad', type: 'feriado', scope: 'general', date: '2026-12-25', allDay: true, source: 'system', createdAt: '2026-01-01' },
]

function readEvents() {
    return readStoredValue<AgendaEvent[]>(storageKey, [])
}

function writeEvents(events: AgendaEvent[]) {
    writeStoredValue(storageKey, events)
    repositoryEvents.emit()
}

function dateForBirthday(birthDate: string, year: number) {
    const [, month, day] = birthDate.split('-')
    return month && day ? `${year}-${month}-${day}` : ''
}

function derivedBirthdayEvents(year: number): AgendaEvent[] {
    const students = listStudents().filter((student) => student.birthDate)
    const teachers = listStaff().filter((teacher) => teacher.birthDate)
    return [
        ...students.map((student) => ({ id: `BIRTHDAY-ST-${student.id}-${year}`, title: `Cumpleaños · ${student.fullName}`, type: 'cumpleanos' as const, scope: 'general' as const, date: dateForBirthday(student.birthDate!, year), allDay: true, source: 'system' as const, createdAt: `${year}-01-01`, personId: student.id, personType: 'student' as const })),
        ...teachers.map((teacher) => ({ id: `BIRTHDAY-T-${teacher.id}-${year}`, title: `Cumpleaños · ${teacher.fullName}`, type: 'cumpleanos' as const, scope: 'general' as const, date: dateForBirthday(teacher.birthDate!, year), allDay: true, source: 'system' as const, createdAt: `${year}-01-01`, personId: teacher.id, personType: 'teacher' as const })),
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
    const courses = listCourses()
    const commissionEvents = courses.flatMap((course) => course.commissions.flatMap((commission) => {
        const schedule = parseSchedule(commission.schedule)
        return getWeeklyAgendaDates(commission.startDate, commission.endDate, schedule.weekdays, year).map((date) => ({
            id: `CLASS-${commission.id}-${date}`,
            title: `${course.name} · ${commission.name}`,
            description: `${commission.teachers.join(', ') || 'Docente a confirmar'} · ${commission.schedule}`,
            type: 'clase' as const,
            scope: 'commission' as const,
            commissionId: commission.id,
            date,
            allDay: false,
            source: 'system' as const,
            createdAt: `${year}-01-01`,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
        }))
    }))
    const privateEvents = listPrivateLessons().flatMap((lesson) => getWeeklyAgendaDates(lesson.startDate, lesson.endDate, lesson.days.map((day) => weekdayByShortName[day.slice(0, 3).toLowerCase()]).filter((day): day is number => day !== undefined), year).map((date) => ({
        id: `PRIVATE-${lesson.id}-${date}`,
        title: `Particular · ${lesson.teacher}`,
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
    return listEnrollmentOpenings().filter((opening) => opening.startDate.startsWith(`${year}-`)).flatMap((opening) => {
        const course = listCourses().find((item) => item.id === opening.courseId)
        return [{ id: `ENROLLMENT-OPEN-${opening.id}`, title: `Inscripciones abiertas · ${course?.name ?? 'Oferta académica'}`, type: 'inscripcion' as const, scope: 'general' as const, date: opening.startDate, endDate: opening.endDate, allDay: true, source: 'system' as const, createdAt: `${year}-01-01` }]
    })
}

export function useAgendaRepositoryVersion() {
    return useSyncExternalStore(repositoryEvents.subscribe, repositoryEvents.getRevision, () => 0)
}

export function listAgendaEvents(year: number) {
    const stored = readEvents()
    const storedIds = new Set(stored.map((event) => event.id))
    const holidays = initialHolidays.filter((event) => event.date.startsWith(`${year}-`) && !storedIds.has(event.id))
    return [...holidays, ...derivedBirthdayEvents(year), ...derivedClassEvents(year), ...derivedEnrollmentEvents(year), ...stored.filter((event) => event.date.startsWith(`${year}-`))].sort((a, b) => a.date.localeCompare(b.date))
}

export function listUpcomingAgendaEvents(fromDate: string, limit = 6, excludedTypes: AgendaEventType[] = []) {
    return listAgendaEvents(Number(fromDate.slice(0, 4))).filter((event) => event.date >= fromDate && !excludedTypes.includes(event.type)).slice(0, limit)
}

export function createAgendaEvent(event: Omit<AgendaEvent, 'id' | 'source' | 'createdAt'>) {
    const next: AgendaEvent = { ...event, id: `EVENT-${Date.now()}`, source: 'admin', createdAt: new Date().toISOString() }
    writeEvents([...readEvents(), next])
    return next
}

export function createRecurringAgendaEvents(event: Omit<AgendaEvent, 'id' | 'source' | 'createdAt'>, repeatUntil: string, weekdays: number[]) {
    const duration = event.endDate ? Math.max(0, Math.round((new Date(`${event.endDate}T12:00:00`).getTime() - new Date(`${event.date}T12:00:00`).getTime()) / 86400000)) : 0
    const occurrences: AgendaEvent[] = []
    let cursor = event.date
    let index = 0
    while (cursor <= repeatUntil) {
        if (weekdays.includes(new Date(`${cursor}T12:00:00`).getDay())) {
            occurrences.push({ ...event, date: cursor, endDate: duration ? shiftAgendaDate(cursor, duration) : undefined, id: `EVENT-${Date.now()}-${index}`, source: 'admin', createdAt: new Date().toISOString() })
            index += 1
        }
        cursor = shiftAgendaDate(cursor, 1)
    }
    writeEvents([...readEvents(), ...occurrences])
    return occurrences
}

export function updateAgendaEvent(id: string, changes: Partial<Omit<AgendaEvent, 'id' | 'source' | 'createdAt'>>) {
    writeEvents(readEvents().map((event) => event.id === id ? { ...event, ...changes } : event))
}

export function removeAgendaEvent(id: string) {
    writeEvents(readEvents().filter((event) => event.id !== id))
}
