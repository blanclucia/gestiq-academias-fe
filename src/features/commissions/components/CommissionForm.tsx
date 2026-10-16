import { FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { WeekDaysCheckboxGroup } from '@/components/forms/WeekDaysCheckboxGroup'
import { TimeRangeField } from '@/components/forms/TimeRangeField'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { getActiveAcademicCycleId, listCourses, listStaff, useAcademyRepositoryVersion } from '@/services/academyRepository'
import { useState } from 'react'
import { TeacherMultiSelect } from './TeacherMultiSelect'
import { StatusHelp } from '@/components/ui/StatusHelp'
import { commissionStatusHelp } from '../model/commissionStatusHelp'
import { commissionWeekDays as weekDays, parseCommissionSchedule } from '../model/commissionSchedule'

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
    return {
        name: initialValues?.name ?? '',
        teachers: initialValues?.teachers ?? (initialValues?.teacher && initialValues.teacher !== 'Docente por asignar' ? [initialValues.teacher] : []),
        capacity: initialValues?.capacity ?? 20,
        amount: initialValues?.amount ?? 48000,
        startDate: initialValues?.startDate ?? '2026-03-01',
        endDate: initialValues?.endDate ?? '2026-12-15',
        dueDay: initialValues?.dueDay ?? 10,
        status: initialValues?.status ?? 'Programada',
        ...parseCommissionSchedule(initialValues?.schedule),
    }
}

export function CommissionForm({
    initialValues,
    value,
    onValueChange,
    branchId,
}: {
    // Branch of the offer: a teacher created from here is assigned to it.
    branchId?: string
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
                        <SearchableSelect
                            value={initialValues?.course ?? selectedCourse}
                            onChange={setSelectedCourse}
                            disabled={Boolean(initialValues?.course)}
                            placeholder={courseOptions.length === 0 ? 'No hay ofertas disponibles' : 'Buscar oferta académica'}
                            options={courseOptions.map((course) => ({ value: course, label: course }))}
                        />
                    </FormField>

                    <FormField label="Nombre de la comisión" required>
                        <input name="commissionName" className="form-input" type="text" value={formValue.name} onChange={(event) => update({ name: event.target.value })} placeholder="Ej: Grupo A" />
                    </FormField>

                    <FormField label="Profesores asignados">
                        <TeacherMultiSelect options={teacherOptions} value={formValue.teachers} onChange={(teachers) => update({ teachers })} branchId={branchId} />
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
                    <FormField label="Estado inicial" info={<StatusHelp label="Qué significa cada estado" items={commissionStatusHelp} />}>
                        <SearchableSelect value={formValue.status} onChange={(status) => update({ status: status as CommissionFormValue['status'] })} options={[{ value: 'Programada', label: 'Programada' }, { value: 'Activa', label: 'Activa' }]} />
                    </FormField>
                </FormGrid>
            </FormSection>
        </div>
    )
}
