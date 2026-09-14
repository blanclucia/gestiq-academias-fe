import { useState } from "react";
import {
    createAgendaEvent,
    createRecurringAgendaEvents,
    listAgendaEvents,
    removeAgendaEvent,
    updateAgendaEvent,
    useAgendaRepositoryVersion,
    type AgendaEvent,
    type AgendaEventType,
} from "@/services/agendaRepository";
import { AgendaDayDetailsModal } from "../components/AgendaDayDetailsModal";
import { AgendaUpcomingPanel } from "../components/AgendaUpcomingPanel";
import { AgendaEventModal, type AgendaEventFormValue } from "../components/AgendaEventModal";
import { AgendaToolbar } from "../components/AgendaToolbar";
import { AgendaFilters, type AgendaEventFilter } from "../components/AgendaFilters";
import { MonthCalendar } from "../components/MonthCalendar";

const generalEventTypes: AgendaEventType[] = [
    "reunion",
    "academico",
    "recordatorio",
    "otro",
];

/*
                <div className="agenda-calendar-grid"><div className="agenda-weekdays">{weekDays.map((day) => <span key={day}>{day}</span>)}</div>{calendarWeeks.map((week, weekIndex) => { const rangeEvents = visibleEvents.filter((event) => event.endDate && event.date <= week[6].date && event.endDate >= week[0].date && event.endDate >= monthStart && event.date <= monthEnd); const rangeSpace = rangeEvents.length ? 32 + Math.min(rangeEvents.length, 4) * 24 : 32; return <div className="agenda-week-row" key={`week-${weekIndex}`} style={{ minHeight: `${112 + rangeSpace}px` }}>{week.map((day) => <button type="button" className={`agenda-day ${day.outside ? 'outside' : ''} ${day.date === selectedDate ? 'selected' : ''}`} key={day.date} onClick={() => openCreate(day.date)}><span className="agenda-day-number">{day.day}</span><span className="agenda-day-events" style={{ top: `${rangeSpace}px` }} onClick={(event) => { event.stopPropagation(); setDetailsDate(day.date) }}>{(eventsByDate[day.date] ?? []).slice(0, 4).map((event) => <span className={`agenda-event-chip ${eventColor(event.type)} ${day.outside ? 'outside-event' : ''}`} key={event.id}>{eventLabel(event)}</span>)}{(eventsByDate[day.date]?.length ?? 0) > 4 && <small>+{eventsByDate[day.date].length - 4} más</small>}</span></button>)}<div className="agenda-range-layer">{rangeEvents.flatMap((event, lane) => { const segments = getRangeSegments(event, week); return segments.map((segment, segmentIndex) => { const startsInWeek = event.date > week[0].date; const endsInWeek = event.endDate! < week[6].date; const left = segment.startColumn * (100 / 7); const width = (segment.endColumn - segment.startColumn + 1) * (100 / 7); return <span className={`agenda-range-event ${eventColor(event.type)} ${segment.outside ? 'outside-event' : ''} ${startsInWeek && segmentIndex === 0 ? 'range-start' : ''} ${endsInWeek && segmentIndex === segments.length - 1 ? 'range-end' : ''}`} key={`${event.id}-${weekIndex}-${segmentIndex}`} style={{ left: `${left}%`, width: `${width}%`, top: `${32 + lane * 24}px` }} onClick={() => setDetailsDate(event.date)}>{eventLabel(event)}</span> })})}</div></div> })}</div>
*/

export function AgendaPage() {
    useAgendaRepositoryVersion();
    const today = new Date();
    const [viewDate, setViewDate] = useState(
        new Date(today.getFullYear(), today.getMonth(), 1),
    );
    const [selectedType, setSelectedType] = useState<AgendaEventFilter>("all");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
    const [detailsDate, setDetailsDate] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const initialDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const [eventForm, setEventForm] = useState<AgendaEventFormValue>({
        title: "",
        description: "",
        type: "academico" as AgendaEventType,
        date: initialDate,
        endDate: initialDate,
        location: "",
        allDay: true,
        startTime: "",
        endTime: "",
        recurrence: "none" as "none" | "weekly",
        repeatUntil: initialDate,
        repeatDays: [new Date(`${initialDate}T12:00:00`).getDay()],
    });
    const events = listAgendaEvents(viewDate.getFullYear());
    const visibleEvents = events.filter(
        (event) =>
            selectedType === "all" ||
            (selectedType === "general"
                ? generalEventTypes.includes(event.type)
                : event.type === selectedType),
    );
    const upcomingEvents = visibleEvents
        .filter(
            (event) =>
                event.date >=
                `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
        )
        .slice(0, 8);
    const detailsEvents = detailsDate
        ? visibleEvents.filter(
            (event) =>
                event.date === detailsDate ||
                Boolean(
                    event.endDate &&
                    event.date < detailsDate &&
                    event.endDate >= detailsDate,
                ),
        )
        : [];

    const openCreate = (date = eventForm.date) => {
        const [year, month] = date.split("-").map(Number);
        if (year && month) setViewDate(new Date(year, month - 1, 1));
        setEditingEvent(null);
        setEventForm((current) => ({
            ...current,
            date,
            endDate: date,
            allDay: true,
            startTime: "",
            endTime: "",
            repeatUntil: date,
            repeatDays: [new Date(`${date}T12:00:00`).getDay()],
            recurrence: "none",
        }));
        setSelectedDate(date);
        setIsCreateOpen(true);
    };
    const openEdit = (event: AgendaEvent) => {
        setEditingEvent(event);
        setEventForm({
            title: event.title,
            description: event.description ?? "",
            type: event.type,
            date: event.date,
            endDate: event.endDate ?? event.date,
            location: event.location ?? "",
            allDay: event.allDay,
            startTime: event.startTime ?? "",
            endTime: event.endTime ?? "",
            recurrence: "none",
            repeatUntil: event.date,
            repeatDays: [new Date(`${event.date}T12:00:00`).getDay()],
        });
        setIsCreateOpen(true);
    };
    const saveEvent = () => {
        const changes = {
            title: eventForm.title.trim(),
            description: eventForm.description.trim() || undefined,
            type: eventForm.type,
            scope: "general" as const,
            date: eventForm.date,
            endDate:
                eventForm.endDate === eventForm.date ? undefined : eventForm.endDate,
            allDay: eventForm.allDay,
            startTime: eventForm.allDay ? undefined : eventForm.startTime,
            endTime: eventForm.allDay ? undefined : eventForm.endTime,
            location: eventForm.location.trim() || undefined,
        };
        if (editingEvent) updateAgendaEvent(editingEvent.id, changes);
        else if (eventForm.recurrence === "weekly")
            createRecurringAgendaEvents(
                changes,
                eventForm.repeatUntil,
                eventForm.repeatDays,
            );
        else createAgendaEvent(changes);
        setIsCreateOpen(false);
        setEditingEvent(null);
        setEventForm({
            title: "",
            description: "",
            type: "academico",
            date: eventForm.date,
            endDate: eventForm.endDate,
            location: "",
            allDay: true,
            startTime: "",
            endTime: "",
            recurrence: "none",
            repeatUntil: eventForm.date,
            repeatDays: [new Date(`${eventForm.date}T12:00:00`).getDay()],
        });
    };

    return (
        <div className="dashboard-page agenda-page">
            <AgendaDayDetailsModal date={detailsDate} events={detailsEvents} onClose={() => setDetailsDate("")} />
            <AgendaEventModal
                open={isCreateOpen}
                editingEvent={editingEvent}
                value={eventForm}
                onChange={setEventForm}
                onClose={() => {
                    setIsCreateOpen(false);
                    setEditingEvent(null);
                }}
                onSubmit={saveEvent}
            />

            <div className="page-header agenda-header">
                <div>
                    <h1>Agenda académica</h1>
                    <p>
                        Clases, feriados, cumpleaños y eventos importantes en un solo lugar.
                    </p>
                </div>
            </div>
            <div className="agenda-layout">
                <div className="agenda-calendar-column">
                    <AgendaToolbar
                        viewDate={viewDate}
                        onPreviousMonth={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                        onNextMonth={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                        onToday={() => {
                            setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
                            setSelectedDate(initialDate);
                        }}
                    />
                    <section className="agenda-calendar-panel">
                        <AgendaFilters value={selectedType} onChange={setSelectedType} onCreate={() => openCreate()} />
                        <MonthCalendar viewDate={viewDate} events={visibleEvents} selectedDate={selectedDate} todayDate={initialDate} onCreate={openCreate} onShowDetails={setDetailsDate} />
                    </section>
                </div>
                <AgendaUpcomingPanel events={upcomingEvents} onEdit={openEdit} onDelete={removeAgendaEvent} />
            </div>
        </div>
    );
}
