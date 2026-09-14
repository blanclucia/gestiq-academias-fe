import { getAgendaEventColor, getAgendaEventLabel, getAgendaRangeSegments, getCalendarDays } from '@/domain/agenda/agendaRules'
import type { AgendaEvent } from '@/services/agendaRepository'

const weekDays = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

type MonthCalendarProps = {
    viewDate: Date
    events: AgendaEvent[]
    selectedDate: string
    todayDate: string
    onCreate: (date: string) => void
    onShowDetails: (date: string) => void
}

export function MonthCalendar({ viewDate, events, selectedDate, todayDate, onCreate, onShowDetails }: MonthCalendarProps) {
    const calendarDays = getCalendarDays(viewDate.getFullYear(), viewDate.getMonth())
    const calendarWeeks = Array.from({ length: 6 }, (_, index) => calendarDays.slice(index * 7, index * 7 + 7))
    const monthStart = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-01`
    const lastDay = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
    const monthEnd = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const eventsByDate: Record<string, AgendaEvent[]> = {}
    events.filter((event) => !event.endDate).forEach((event) => (eventsByDate[event.date] ??= []).push(event))

    return (
        <div className="agenda-calendar-grid">
            <div className="agenda-weekdays">{weekDays.map((day) => <span key={day}>{day}</span>)}</div>
            {calendarWeeks.map((week, weekIndex) => {
                const rangeEvents = events.filter((event) => event.endDate && event.date <= week[6].date && event.endDate >= week[0].date && event.endDate >= monthStart && event.date <= monthEnd)
                const rangeSpace = rangeEvents.length ? 32 + Math.min(rangeEvents.length, 4) * 24 : 32
                return (
                    <div className="agenda-week-row" key={`week-${weekIndex}`} style={{ minHeight: `${112 + rangeSpace}px` }}>
                        {week.map((day) => (
                            <button type="button" className={`agenda-day ${day.outside ? 'outside' : ''} ${day.date === selectedDate ? 'selected' : ''} ${day.date === todayDate ? 'today' : ''}`} key={day.date} onClick={() => onCreate(day.date)}>
                                <span className="agenda-day-number">{day.day}</span>
                                <span className="agenda-day-events" style={{ top: `${rangeSpace}px` }} onClick={(event) => { event.stopPropagation(); onShowDetails(day.date) }}>
                                    {(eventsByDate[day.date] ?? []).slice(0, 4).map((event) => <span className={`agenda-event-chip ${getAgendaEventColor(event.type)} ${event.type === 'clase' && event.source === 'system' ? 'system-class-event' : ''} ${day.outside ? 'outside-event' : ''}`} key={event.id}>{getAgendaEventLabel(event)}</span>)}
                                    {(eventsByDate[day.date]?.length ?? 0) > 4 && <small>+{eventsByDate[day.date].length - 4} más</small>}
                                </span>
                            </button>
                        ))}
                        <div className="agenda-range-layer">
                            {rangeEvents.flatMap((event, lane) => {
                                const segments = getAgendaRangeSegments(event, week)
                                return segments.map((segment, segmentIndex) => {
                                    const startsInWeek = event.date > week[0].date
                                    const endsInWeek = event.endDate! < week[6].date
                                    const left = segment.startColumn * (100 / 7)
                                    const width = (segment.endColumn - segment.startColumn + 1) * (100 / 7)
                                    return <span className={`agenda-range-event ${getAgendaEventColor(event.type)} ${event.type === 'clase' && event.source === 'system' ? 'system-class-event' : ''} ${segment.outside ? 'outside-event' : ''} ${startsInWeek && segmentIndex === 0 ? 'range-start' : ''} ${endsInWeek && segmentIndex === segments.length - 1 ? 'range-end' : ''}`} key={`${event.id}-${weekIndex}-${segmentIndex}`} style={{ left: `${left}%`, width: `${width}%`, top: `${32 + lane * 24}px` }} onClick={() => onShowDetails(event.date)}>{getAgendaEventLabel(event)}</span>
                                })
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
