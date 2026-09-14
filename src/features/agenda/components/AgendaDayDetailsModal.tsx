import { CalendarDays } from 'lucide-react'
import { EntityFormModal } from '@/components/crud/EntityFormModal'
import { formatAgendaDate, formatAgendaTime, getAgendaEventColor, getAgendaEventLabel } from '@/domain/agenda/agendaRules'
import type { AgendaEvent } from '@/services/agendaRepository'

type AgendaDayDetailsModalProps = {
    date: string
    events: AgendaEvent[]
    onClose: () => void
}

export function AgendaDayDetailsModal({ date, events, onClose }: AgendaDayDetailsModalProps) {
    return (
        <EntityFormModal
            open={Boolean(date)}
            title={date ? `Eventos del ${formatAgendaDate(date)}` : 'Detalle del día'}
            subtitle="Todas las actividades visibles para este día."
            submitLabel="Cerrar"
            cancelLabel="Cerrar"
            onClose={onClose}
            onSubmit={onClose}
        >
            <div className="agenda-day-details">
                {events.map((event) => (
                    <div className="agenda-day-detail" key={event.id}>
                        <span className={`agenda-upcoming-icon ${getAgendaEventColor(event.type)}`}><CalendarDays size={15} /></span>
                        <div>
                            <strong>{getAgendaEventLabel(event)}</strong>
                            <small>
                                {event.endTime
                                    ? `${formatAgendaTime(event.startTime)}-${formatAgendaTime(event.endTime)}`
                                    : (event.description ?? (event.endDate ? `${formatAgendaDate(event.date)} - ${formatAgendaDate(event.endDate)}` : 'Evento de la academia'))}
                                {event.location ? ` · ${event.location}` : ''}
                            </small>
                        </div>
                    </div>
                ))}
            </div>
        </EntityFormModal>
    )
}
