import { CalendarDays, ClipboardList, CreditCard, Save } from 'lucide-react'
import { useRef, useState } from 'react'
import { markInvalidFields } from '@/components/forms/markInvalidFields'
import { SettingsField as Field } from '@/components/forms/SettingsControls'
import { TimeRangeField } from '@/components/forms/TimeRangeField'
import { WeekDaysCheckboxGroup } from '@/components/forms/WeekDaysCheckboxGroup'
import { Card } from '@/components/ui/Card'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { StatusHelp } from '@/components/ui/StatusHelp'
import { listStaff, type AcademicCommission } from '@/services/academyRepository'
import { toCommissionFormValue } from '../model/commissionFormValue'
import { commissionStatusHelp } from '../model/commissionStatusHelp'
import { commissionWeekDays, formatCommissionSchedule } from '../model/commissionSchedule'
import { validateCommission } from '../model/commissionValidation'
import type { CommissionFormValue } from './CommissionForm'
import { TeacherMultiSelect } from './TeacherMultiSelect'

const statusOptions = [{ value: 'Programada', label: 'Programada' }, { value: 'Activa', label: 'Activa' }, { value: 'Cerrada', label: 'Cerrada' }]

type Props = {
    commission: AcademicCommission
    // Other commissions of the same offer, to reject a duplicate name before hitting the API.
    siblingNames: string[]
    saving: boolean
    onSave: (changes: Partial<Omit<AcademicCommission, 'id' | 'studentsCount'>>) => Promise<boolean>
    onCloseCommission: () => void
}

// Editable detail of a commission, same pattern as Mis sedes → Personalización: the data is the form,
// saved from the footer. The parent remounts it (key) when the saved commission changes.
export function CommissionSettingsCards({ commission, siblingNames, saving, onSave, onCloseCommission }: Props) {
    const saved = toCommissionFormValue(commission)
    const [draft, setDraft] = useState<CommissionFormValue>(saved)
    const [error, setError] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)
    const teacherOptions = listStaff().filter((teacher) => teacher.role === 'Docente' && teacher.status === 'Activo')
    const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
    const update = (changes: Partial<CommissionFormValue>) => { setDraft((current) => ({ ...current, ...changes })); setError('') }

    const save = async () => {
        const message = markInvalidFields(containerRef.current, validateCommission(draft, siblingNames))
        if (message) { setError(message); return }
        const ok = await onSave({ ...draft, name: draft.name.trim(), teacher: draft.teachers[0] || 'Docente por asignar', schedule: formatCommissionSchedule(draft) })
        if (!ok) setError('No se pudieron guardar los cambios. Revisá que el nombre no esté repetido e intentá nuevamente.')
    }

    return <div className="offer-detail-stack" ref={containerRef}>
        <Card>
            <SectionHeading icon={<ClipboardList size={20} />} title="Datos de la comisión" description="Identificación, equipo docente y cupo." />
            <div className="form-grid academy-settings-grid">
                <Field label="Nombre" required><input name="commissionName" className="form-input" value={draft.name} onChange={(event) => update({ name: event.target.value })} placeholder="Ej: Grupo A" /></Field>
                <Field label="Estado" info={<StatusHelp label="Qué significa cada estado" items={commissionStatusHelp} />}><SearchableSelect value={draft.status} onChange={(status) => update({ status: status as CommissionFormValue['status'] })} options={statusOptions} /></Field>
                <Field label="Profesores asignados"><TeacherMultiSelect options={teacherOptions} value={draft.teachers} onChange={(teachers) => update({ teachers })} /></Field>
                <Field label="Cupo máximo" required><input name="commissionCapacity" className="form-input" type="number" min={1} value={draft.capacity} onChange={(event) => update({ capacity: Number(event.target.value || 1) })} /></Field>
            </div>
        </Card>
        <Card>
            <SectionHeading icon={<CalendarDays size={20} />} title="Horario y vigencia" description="Días, horario y período de cursada; las fechas definen las cuotas que se generan." />
            <div className="form-grid academy-settings-grid">
                <Field label="Días de clase" required full><WeekDaysCheckboxGroup name="commissionDays" value={draft.days} onChange={(days) => update({ days })} days={commissionWeekDays} /></Field>
                <Field label="Horario" required><TimeRangeField fromName="commissionFromTime" toName="commissionToTime" fromTime={draft.fromTime} toTime={draft.toTime} onFromTimeChange={(fromTime) => update({ fromTime })} onToTimeChange={(toTime) => update({ toTime })} /></Field>
                <div />
                <Field label="Inicio de cursada" required><input name="commissionStartDate" className="form-input" type="date" value={draft.startDate} onChange={(event) => update({ startDate: event.target.value })} /></Field>
                <Field label="Fin de cursada" required><input name="commissionEndDate" className="form-input" type="date" min={draft.startDate} value={draft.endDate} onChange={(event) => update({ endDate: event.target.value })} /></Field>
            </div>
        </Card>
        <Card>
            <SectionHeading icon={<CreditCard size={20} />} title="Cobro" description="Valor de la cuota mensual y su vencimiento." />
            <div className="form-grid academy-settings-grid">
                <Field label="Valor mensual" required hint="Al guardar se actualizan las cuotas pendientes."><input name="commissionAmount" className="form-input" type="number" min={0} step={1000} value={draft.amount} onChange={(event) => update({ amount: Number(event.target.value || 0) })} /></Field>
                <Field label="Día de vencimiento" required hint="Entre 1 y 28"><input name="commissionDueDay" className="form-input" type="number" min={1} max={28} value={draft.dueDay} onChange={(event) => update({ dueDay: Math.min(28, Math.max(1, Number(event.target.value || 1))) })} /></Field>
            </div>
        </Card>
        {error && <p className="form-error-message" role="alert">{error}</p>}
        <div className="academy-form-actions">
            {commission.status !== 'Cerrada' && <button type="button" className="secondary-button" onClick={onCloseCommission}>Cerrar comisión</button>}
            {dirty && <button type="button" className="secondary-button" onClick={() => { setDraft(saved); setError(''); markInvalidFields(containerRef.current, { valid: true }) }}>Descartar cambios</button>}
            <button type="button" className="primary-button academy-save-button" disabled={!dirty || saving} onClick={() => { void save() }}><Save size={16} />{saving ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
    </div>
}
