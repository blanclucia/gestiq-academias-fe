import { Plus } from 'lucide-react'
import type { AgendaEventType } from '@/services/agendaRepository'

export type AgendaEventFilter = 'all' | 'general' | AgendaEventType

const filters: Array<{ value: AgendaEventFilter; label: string; tone?: string }> = [
    { value: 'all', label: 'Todos' },
    { value: 'clase', label: 'Clases', tone: 'academic' },
    { value: 'inscripcion', label: 'Inscripciones', tone: 'academic' },
    { value: 'feriado', label: 'Feriados', tone: 'holiday' },
    { value: 'cumpleanos', label: 'Cumpleaños', tone: 'birthday' },
    { value: 'general', label: 'Eventos', tone: 'academic' },
]

export function AgendaFilters({ value, onChange, onCreate }: { value: AgendaEventFilter; onChange: (value: AgendaEventFilter) => void; onCreate: () => void }) {
    return (
        <div className="agenda-filter-row">
            {filters.map((filter) => <button type="button" className={value === filter.value ? `active${filter.tone ? ` ${filter.tone}` : ''}` : ''} onClick={() => onChange(filter.value)} key={filter.value}>{filter.label}</button>)}
            <button type="button" className="primary-button agenda-filter-create" onClick={onCreate}><Plus size={16} /> Nuevo evento</button>
        </div>
    )
}
