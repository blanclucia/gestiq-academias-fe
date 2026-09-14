import { ChevronLeft, ChevronRight } from 'lucide-react'

const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export function AgendaToolbar({ viewDate, onPreviousMonth, onNextMonth, onToday }: { viewDate: Date; onPreviousMonth: () => void; onNextMonth: () => void; onToday: () => void }) {
    return (
        <div className="agenda-toolbar">
            <div className="agenda-view-switch"><button type="button" className="active">Mes</button><button type="button" disabled>Semana</button><button type="button" disabled>Día</button></div>
            <div className="agenda-month-nav">
                <button type="button" aria-label="Mes anterior" onClick={onPreviousMonth}><ChevronLeft size={17} /></button>
                <strong>{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</strong>
                <button type="button" aria-label="Mes siguiente" onClick={onNextMonth}><ChevronRight size={17} /></button>
            </div>
            <button type="button" className="secondary-button compact-button" onClick={onToday}>Hoy</button>
        </div>
    )
}
