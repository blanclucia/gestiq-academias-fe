import type { AgendaEvent, AgendaEventType } from '@/services/agendaRepository'

export type CalendarDay = { date: string; day: number; outside: boolean }

export function getCalendarDays(year: number, month: number): CalendarDay[] {
    const firstCalendarDate = new Date(year, month, 1 - new Date(year, month, 1).getDay())
    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(firstCalendarDate)
        date.setDate(firstCalendarDate.getDate() + index)
        return {
            date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
            day: date.getDate(),
            outside: date.getFullYear() !== year || date.getMonth() !== month,
        }
    })
}

export function formatAgendaDate(date: string) {
    return new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${date}T12:00:00`))
}

export function formatAgendaTime(time?: string) {
    if (!time) return ''
    const [hours, minutes] = time.split(':').map(Number)
    return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')}${hours >= 12 ? 'pm' : 'am'}`
}

export function getAgendaEventLabel(event: AgendaEvent) {
    return event.startTime && (event.type === 'clase' || !event.allDay) ? `${formatAgendaTime(event.startTime)} ${event.title}` : event.title
}

export function getAgendaEventColor(type: AgendaEventType) {
    return type === 'feriado' ? 'holiday' : type === 'cumpleanos' ? 'birthday' : type
}

export function getAgendaRangeSegments(event: AgendaEvent, week: Array<Pick<CalendarDay, 'date' | 'outside'>>) {
    const segments: Array<{ startColumn: number; endColumn: number; outside: boolean }> = []
    week.forEach((day, column) => {
        if (!event.endDate || day.date < event.date || day.date > event.endDate) return
        const previous = segments[segments.length - 1]
        if (!previous || previous.outside !== day.outside || previous.endColumn !== column - 1) {
            segments.push({ startColumn: column, endColumn: column, outside: day.outside })
        } else previous.endColumn = column
    })
    return segments
}

export function shiftAgendaDate(date: string, days: number) {
    const value = new Date(`${date}T12:00:00`)
    value.setDate(value.getDate() + days)
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

export function getAgendaDatesInYear(startDate: string, endDate: string, year: number) {
    const start = new Date(`${startDate}T12:00:00`)
    const end = new Date(`${endDate}T12:00:00`)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return []
    const dates: string[] = []
    let cursor = startDate < `${year}-01-01` ? `${year}-01-01` : startDate
    const limit = endDate > `${year}-12-31` ? `${year}-12-31` : endDate
    while (cursor <= limit) {
        dates.push(cursor)
        cursor = shiftAgendaDate(cursor, 1)
    }
    return dates
}

export function getWeeklyAgendaDates(startDate: string, endDate: string, weekdays: number[], year: number) {
    return getAgendaDatesInYear(startDate, endDate, year).filter((date) => weekdays.includes(new Date(`${date}T12:00:00`).getDay()))
}
