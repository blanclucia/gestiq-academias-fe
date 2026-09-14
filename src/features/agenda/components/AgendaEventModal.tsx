import { EntityFormModal, FormField } from '@/components/crud/EntityFormModal'
import { invalidForm, validForm } from '@/components/forms/formValidation'
import type { AgendaEvent, AgendaEventType } from '@/services/agendaRepository'

export type AgendaEventFormValue = {
    title: string
    description: string
    type: AgendaEventType
    date: string
    endDate: string
    location: string
    allDay: boolean
    startTime: string
    endTime: string
    recurrence: 'none' | 'weekly'
    repeatUntil: string
    repeatDays: number[]
}

const eventTypes: Array<{ value: AgendaEventType; label: string }> = [
    { value: 'academico', label: 'Académico' }, { value: 'reunion', label: 'Reunión' },
    { value: 'recordatorio', label: 'Recordatorio' }, { value: 'otro', label: 'Otro' },
]
const repeatDays = [{ value: 1, label: 'L' }, { value: 2, label: 'M' }, { value: 3, label: 'X' }, { value: 4, label: 'J' }, { value: 5, label: 'V' }, { value: 6, label: 'S' }, { value: 0, label: 'D' }]

function validateAgendaEvent(value: AgendaEventFormValue) {
    const fieldErrors: Record<string, string> = {}
    if (!value.title.trim()) fieldErrors.title = 'Ingresá un título.'
    if (!value.date) fieldErrors.date = 'Ingresá la fecha inicial.'
    if (!value.endDate || value.endDate < value.date) fieldErrors.endDate = 'Ingresá una fecha final válida.'
    if (!value.allDay && !value.startTime) fieldErrors.startTime = 'Ingresá la hora de inicio.'
    if (!value.allDay && (!value.endTime || (value.endDate === value.date && value.endTime < value.startTime))) fieldErrors.endTime = 'Ingresá una hora final válida.'
    if (value.recurrence === 'weekly' && value.repeatDays.length === 0) fieldErrors.repeatDays = 'Seleccioná al menos un día.'
    if (value.recurrence === 'weekly' && value.repeatUntil < value.date) fieldErrors.repeatUntil = 'La repetición no puede finalizar antes del evento.'
    return Object.keys(fieldErrors).length ? invalidForm('Revisá los datos del evento.', fieldErrors) : validForm
}

type Props = { open: boolean; editingEvent: AgendaEvent | null; value: AgendaEventFormValue; onChange: (value: AgendaEventFormValue) => void; onClose: () => void; onSubmit: () => void }

export function AgendaEventModal({ open, editingEvent, value, onChange, onClose, onSubmit }: Props) {
    const update = (changes: Partial<AgendaEventFormValue>) => onChange({ ...value, ...changes })
    const toggleRepeatDay = (day: number) => update({ repeatDays: value.repeatDays.includes(day) ? value.repeatDays.filter((item) => item !== day) : [...value.repeatDays, day] })

    return (
        <EntityFormModal open={open} title={editingEvent ? 'Editar evento' : 'Nuevo evento'} subtitle="Agregá una fecha visible para toda la academia." submitLabel={editingEvent ? 'Guardar cambios' : 'Guardar evento'} validate={() => validateAgendaEvent(value)} onClose={onClose} onSubmit={onSubmit}>
            <div className="form-grid">
                <FormField label="Título" required><input name="title" className="form-input" value={value.title} onChange={(event) => update({ title: event.target.value })} placeholder="Ej. Reunión de equipo" /></FormField>
                <FormField label="Tipo" required><select className="form-input" value={value.type} onChange={(event) => update({ type: event.target.value as AgendaEventType })}>{eventTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></FormField>
                <div className="agenda-date-range">
                    <FormField label="Desde" required><input name="date" className="form-input" type="date" value={value.date} onChange={(event) => update({ date: event.target.value, endDate: value.endDate < event.target.value ? event.target.value : value.endDate })} /></FormField>
                    <FormField label="Hasta" required><input name="endDate" className="form-input" type="date" min={value.date} value={value.endDate} onChange={(event) => update({ endDate: event.target.value })} /></FormField>
                </div>
                <label className="agenda-all-day-toggle"><input type="checkbox" checked={value.allDay} onChange={(event) => update({ allDay: event.target.checked })} /><span>Todo el día</span></label>
                {!value.allDay && <div className="agenda-date-range">
                    <FormField label="Hora de inicio" required><input name="startTime" className="form-input" type="time" value={value.startTime} onChange={(event) => update({ startTime: event.target.value })} /></FormField>
                    <FormField label="Hora de fin" required><input name="endTime" className="form-input" type="time" min={value.date === value.endDate ? value.startTime : undefined} value={value.endTime} onChange={(event) => update({ endTime: event.target.value })} /></FormField>
                </div>}
                {!editingEvent && <>
                    <FormField label="Repetir"><select className="form-input" value={value.recurrence} onChange={(event) => { const recurrence = event.target.value as AgendaEventFormValue['recurrence']; update({ recurrence, repeatUntil: recurrence === 'weekly' && value.repeatUntil < value.date ? value.date : value.repeatUntil }) }}><option value="none">No repetir</option><option value="weekly">Cada semana</option></select></FormField>
                    {value.recurrence === 'weekly' && <>
                        <FormField label="Días"><div className="agenda-repeat-days" data-field="repeatDays">{repeatDays.map((day) => <button type="button" className={value.repeatDays.includes(day.value) ? 'active' : ''} key={day.value} onClick={() => toggleRepeatDay(day.value)}>{day.label}</button>)}</div></FormField>
                        <FormField label="Repetir hasta" required><input name="repeatUntil" className="form-input" type="date" min={value.date} value={value.repeatUntil} onChange={(event) => update({ repeatUntil: event.target.value })} /></FormField>
                    </>}
                </>}
                <FormField label="Lugar"><input className="form-input" value={value.location} onChange={(event) => update({ location: event.target.value })} placeholder="Opcional" /></FormField>
                <FormField label="Descripción" full><textarea className="form-textarea" value={value.description} onChange={(event) => update({ description: event.target.value })} rows={3} /></FormField>
            </div>
        </EntityFormModal>
    )
}
