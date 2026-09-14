import { Check, ChevronDown, Search } from 'lucide-react'
import { FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { WeekDaysCheckboxGroup } from '@/components/forms/WeekDaysCheckboxGroup'
import { TimeRangeField } from '@/components/forms/TimeRangeField'
import { getActiveAcademicCycleId, listCourses, listStaff, useAcademyRepositoryVersion } from '@/services/academyRepository'
import { useEffect, useRef, useState } from 'react'

const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function TeacherMultiSelect({ options, value, onChange }: { options: Array<{ id: string; fullName: string }>; value: string[]; onChange: (value: string[]) => void }) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const pickerRef = useRef<HTMLDivElement>(null)
    const filteredOptions = options.filter((teacher) => teacher.fullName.toLocaleLowerCase('es-AR').includes(search.trim().toLocaleLowerCase('es-AR')))
    const summary = value.length === 0 ? 'Seleccionar profesores' : value.length === 1 ? value[0] : `${value.length} profesores seleccionados`

    useEffect(() => {
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!pickerRef.current?.contains(event.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', closeOnOutsideClick)
        return () => document.removeEventListener('mousedown', closeOnOutsideClick)
    }, [])

    return <div className="commission-teacher-select" ref={pickerRef}>
        <button type="button" className="commission-teacher-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
            <span className={value.length === 0 ? 'placeholder' : ''}>{summary}</span>
            <ChevronDown size={16} />
        </button>
        {open && <div className="commission-teacher-dropdown">
            <div className="commission-teacher-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar profesor" aria-label="Buscar profesor" autoFocus /></div>
            <div className="commission-teacher-options" role="listbox" aria-multiselectable="true">
                {filteredOptions.map((teacher) => {
                    const selected = value.includes(teacher.fullName)
                    return <button type="button" role="option" aria-selected={selected} key={teacher.id} onClick={() => onChange(selected ? value.filter((name) => name !== teacher.fullName) : [...value, teacher.fullName])}>
                        <span className={`commission-teacher-checkbox${selected ? ' selected' : ''}`}>{selected && <Check size={12} />}</span>
                        <span>{teacher.fullName}</span>
                    </button>
                })}
                {filteredOptions.length === 0 && <div className="commission-teacher-no-results">No se encontraron profesores.</div>}
            </div>
        </div>}
    </div>
}

export type CommissionFormValue = {
    name: string
    teachers: string[]
    capacity: number
    amount: number
    startDate: string
    endDate: string
    dueDay: number
    status: 'Activa' | 'Programada' | 'Cerrada'
    days: string[]
    fromTime: string
    toTime: string
}

function getInitialValue(initialValues?: { name?: string; teacher?: string; teachers?: string[]; capacity?: number; amount?: number; startDate?: string; endDate?: string; dueDay?: number; status?: CommissionFormValue['status']; schedule?: string }): CommissionFormValue {
    const schedule = initialValues?.schedule ?? ''
    return {
        name: initialValues?.name ?? '',
        teachers: initialValues?.teachers ?? (initialValues?.teacher && initialValues.teacher !== 'Docente por asignar' ? [initialValues.teacher] : []),
        capacity: initialValues?.capacity ?? 20,
        amount: initialValues?.amount ?? 48000,
        startDate: initialValues?.startDate ?? '2026-03-01',
        endDate: initialValues?.endDate ?? '2026-12-15',
        dueDay: initialValues?.dueDay ?? 10,
        status: initialValues?.status ?? 'Programada',
        days: weekDays.filter((day) => schedule.includes(day.slice(0, 3))),
        fromTime: schedule.match(/(\d{2}:\d{2})/)?.[1] ?? '18:30',
        toTime: schedule.match(/-\s*(\d{2}:\d{2})/)?.[1] ?? '20:00',
    }
}

export function CommissionForm({
    initialValues,
    value,
    onValueChange,
}: {
    initialValues?: {
        name?: string
        course?: string
        teacher?: string
        teachers?: string[]
        capacity?: number
        amount?: number
        startDate?: string
        endDate?: string
        dueDay?: number
        status?: 'Activa' | 'Programada' | 'Cerrada'
        schedule?: string
    }
    value?: CommissionFormValue
    onValueChange?: (value: CommissionFormValue) => void
}) {
    useAcademyRepositoryVersion()
    const availableCourses = listCourses().filter((course) => course.cycleId === getActiveAcademicCycleId()).map((course) => course.name)
    const courseOptions = initialValues?.course && !availableCourses.includes(initialValues.course)
        ? [initialValues.course, ...availableCourses]
        : availableCourses
    const [internalValue, setInternalValue] = useState(() => getInitialValue(initialValues))
    const [selectedCourse, setSelectedCourse] = useState(initialValues?.course ?? courseOptions[0] ?? '')
    const formValue = value ?? internalValue
    const teacherOptions = listStaff().filter((teacher) => teacher.role === 'Docente' && teacher.status === 'Activo')
    const update = (changes: Partial<CommissionFormValue>) => {
        const next = { ...formValue, ...changes }
        if (value) onValueChange?.(next)
        else setInternalValue(next)
    }

    return (
        <div className="form-stack">
            <FormSection title="Datos de la comisión">
                <FormGrid>
                    <FormField label="Oferta académica base" required>
                        <select
                            className="form-input"
                            value={initialValues?.course ?? selectedCourse}
                            onChange={(event) => setSelectedCourse(event.target.value)}
                            disabled={Boolean(initialValues?.course)}
                        >
                            {courseOptions.length === 0 && <option value="">No hay ofertas disponibles</option>}
                            {courseOptions.map((course) => (
                                <option key={course} value={course}>
                                    {course}
                                </option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Nombre de la comisión" required>
                        <input name="commissionName" className="form-input" type="text" value={formValue.name} onChange={(event) => update({ name: event.target.value })} placeholder="Ej: Grupo A" />
                    </FormField>

                    <FormField label="Profesores asignados">
                        <TeacherMultiSelect options={teacherOptions} value={formValue.teachers} onChange={(teachers) => update({ teachers })} />
                    </FormField>

                    <FormField label="Cupo máximo" required>
                        <input name="commissionCapacity" className="form-input" type="number" value={formValue.capacity} min={1} onChange={(event) => update({ capacity: Number(event.target.value || 1) })} />
                    </FormField>

                    <FormField label="Valor mensual de la comisión" required>
                        <div className="commission-amount-field"><input name="commissionAmount" className="form-input" type="number" value={formValue.amount} min={0} step={1000} onChange={(event) => update({ amount: Number(event.target.value || 0) })} /><small>Al guardar, se actualizarán las cuotas pendientes de esta comisión.</small></div>
                    </FormField>
                </FormGrid>
            </FormSection>

            <FormSection title="Período y facturación" description="Estas fechas determinan las mensualidades que se generarán para cada alumno.">
                <FormGrid>
                    <FormField label="Inicio de cursada" required>
                        <input name="commissionStartDate" className="form-input" type="date" value={formValue.startDate} onChange={(event) => update({ startDate: event.target.value })} />
                    </FormField>
                    <FormField label="Fin de cursada" required>
                        <input name="commissionEndDate" className="form-input" type="date" value={formValue.endDate} min={formValue.startDate} onChange={(event) => update({ endDate: event.target.value })} />
                    </FormField>
                    <FormField label="Día de vencimiento mensual" required>
                        <input name="commissionDueDay" className="form-input" type="number" min={1} max={28} value={formValue.dueDay} onChange={(event) => update({ dueDay: Math.min(28, Math.max(1, Number(event.target.value || 1))) })} />
                    </FormField>
                </FormGrid>
            </FormSection>

            <FormSection title="Horario y disponibilidad" description="Definí la frecuencia real de la comisión.">
                <FormGrid>
                    <FormField label="Días de clase" required>
                        <WeekDaysCheckboxGroup name="commissionDays" value={formValue.days} onChange={(days) => update({ days })} days={weekDays} />
                    </FormField>

                    <FormField label="Horario" required>
                        <TimeRangeField fromName="commissionFromTime" toName="commissionToTime" fromTime={formValue.fromTime} toTime={formValue.toTime} onFromTimeChange={(fromTime) => update({ fromTime })} onToTimeChange={(toTime) => update({ toTime })} />
                    </FormField>
                </FormGrid>
            </FormSection>

            <FormSection title="Estado" description="Controla el ciclo de la comisión.">
                <FormGrid>
                    <FormField label="Estado inicial">
                        <select className="form-input" value={formValue.status} onChange={(event) => update({ status: event.target.value as CommissionFormValue['status'] })}>
                            <option value="Programada">Programada</option>
                            <option value="Activa">Activa</option>
                            <option value="Cerrada">Cerrada</option>
                        </select>
                    </FormField>
                </FormGrid>
            </FormSection>
        </div>
    )
}
