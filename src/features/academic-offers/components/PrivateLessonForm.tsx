import { FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { StaffSelect } from '@/features/staff'
import { WeekDaysCheckboxGroup } from '@/components/forms/WeekDaysCheckboxGroup'
import { TimeRangeField } from '@/components/forms/TimeRangeField'
import { SearchableSelect } from '@/components/ui/SearchableSelect'

export type PrivateLessonFormValue = {
    studentId: string
    teacher: string
    purpose: string
    plan: string
    startDate: string
    endDate: string
    days: string[]
    fromTime: string
    toTime: string
    costPerClass: string
}

export type PrivateLessonStudentOption = {
    id: string
    label: string
}

type PrivateLessonFormProps = {
    value: PrivateLessonFormValue
    onChange: (updater: (current: PrivateLessonFormValue) => PrivateLessonFormValue) => void
    studentOptions: PrivateLessonStudentOption[]
}

const dayOptions = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const planOptions = ['Clase individual', 'Plan mensual', 'Pack 4 clases', 'Pack 8 clases', 'Pack 12 clases']

export function PrivateLessonForm({ value, onChange, studentOptions }: PrivateLessonFormProps) {
    const costLabel = value.plan === 'Plan mensual' ? 'Costo por mes' : 'Costo por clase'

    return (
        <div className="form-stack">
            <FormSection title="Alumno y asignación">
                <FormGrid>
                    <FormField label="Alumno" required>
                        <SearchableSelect value={value.studentId} options={studentOptions.map((option) => ({ value: option.id, label: option.label }))} onChange={(studentId) => onChange((current) => ({ ...current, studentId }))} placeholder="Buscar por nombre o documento" emptyLabel="No encontramos alumnos." />
                    </FormField>

                    <FormField label="Docente" required>
                        <StaffSelect value={value.teacher} onChange={(teacher) => onChange((current) => ({ ...current, teacher }))} />
                    </FormField>

                    <FormField label="Plan" required>
                        <select
                            className="form-input"
                            value={value.plan}
                            onChange={(event) => onChange((current) => ({ ...current, plan: event.target.value }))}
                        >
                            {planOptions.map((plan) => (
                                <option key={plan} value={plan}>
                                    {plan}
                                </option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label={costLabel} required>
                        <input
                            className="form-input"
                            type="number"
                            min="0"
                            value={value.costPerClass}
                            onChange={(event) => onChange((current) => ({ ...current, costPerClass: event.target.value }))}
                            placeholder="Ej: 6500"
                        />
                    </FormField>

                    <FormField label="Particular para" hint="Ej: preparación de examen, apoyo escolar o conversación" full>
                        <textarea className="form-textarea private-lesson-purpose" value={value.purpose} onChange={(event) => onChange((current) => ({ ...current, purpose: event.target.value }))} placeholder="Ej: Preparación de examen final de Historia" rows={2} />
                    </FormField>
                </FormGrid>
            </FormSection>

            <FormSection title="Agenda y saldo">
                <FormGrid>
                    <FormField label="Fecha de inicio" required>
                        <input className="form-input" type="date" value={value.startDate} onChange={(event) => onChange((current) => ({ ...current, startDate: event.target.value }))} />
                    </FormField>

                    <FormField label="Fecha de fin" required>
                        <input className="form-input" type="date" min={value.startDate} value={value.endDate} onChange={(event) => onChange((current) => ({ ...current, endDate: event.target.value }))} />
                    </FormField>

                    <FormField label="Día" required>
                        <WeekDaysCheckboxGroup value={value.days} onChange={(days) => onChange((current) => ({ ...current, days }))} days={dayOptions} />
                    </FormField>

                    <FormField label="Horario" required>
                        <TimeRangeField
                            fromTime={value.fromTime}
                            toTime={value.toTime}
                            onFromTimeChange={(fromTime) => onChange((current) => ({ ...current, fromTime }))}
                            onToTimeChange={(toTime) => onChange((current) => ({ ...current, toTime }))}
                        />
                    </FormField>
                </FormGrid>
            </FormSection>
        </div>
    )
}
