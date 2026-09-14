import { CalendarDays, Pencil, X } from 'lucide-react'
import { formatAgendaDate, getAgendaEventColor, getAgendaEventLabel } from '@/domain/agenda/agendaRules'
import type { AgendaEvent } from '@/services/agendaRepository'

export function AgendaUpcomingPanel({ events, onEdit, onDelete }: { events: AgendaEvent[]; onEdit: (event: AgendaEvent) => void; onDelete: (id: string) => void }) {
    return (
        <aside className="agenda-upcoming-panel">
            <div className="agenda-panel-heading"><div><h2>Próximos eventos</h2><p>Lo que conviene tener a mano.</p></div></div>
            {events.length === 0 ? <p className="agenda-empty">No hay próximos eventos.</p> : (
                <div className="agenda-upcoming-list">
                    {events.map((event) => (
                        <div className="agenda-upcoming-item" key={event.id}>
                            <span className={`agenda-upcoming-icon ${getAgendaEventColor(event.type)}`}><CalendarDays size={16} /></span>
                            <div><strong>{getAgendaEventLabel(event)}</strong><small>{formatAgendaDate(event.date)}{event.location ? ` · ${event.location}` : ''}</small></div>
                            {event.source === 'admin' && (
                                <div className="agenda-upcoming-actions">
                                    <button type="button" aria-label={`Editar ${event.title}`} onClick={() => onEdit(event)}><Pencil size={14} /></button>
                                    <button type="button" aria-label={`Eliminar ${event.title}`} onClick={() => onDelete(event.id)}><X size={14} /></button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </aside>
    )
}
