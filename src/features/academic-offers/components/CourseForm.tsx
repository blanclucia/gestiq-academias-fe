import { FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useState } from 'react'

const statusOptions = [{ value: 'Borrador', label: 'Borrador' }, { value: 'Activo', label: 'Activo' }, { value: 'Cerrado', label: 'Cerrado' }]

export type CourseFormValue = { name: string; description: string; status: 'Activo' | 'Borrador' | 'Cerrado' }

export function CourseForm({ initialValues, value, onValueChange }: {
    initialValues?: {
        name?: string
        description?: string
    }
    value?: CourseFormValue
    onValueChange?: (value: CourseFormValue) => void
}) {
    const [internalValue, setInternalValue] = useState<CourseFormValue>({ name: initialValues?.name ?? '', description: initialValues?.description ?? '', status: 'Borrador' })
    const formValue = value ?? internalValue
    const update = (changes: Partial<CourseFormValue>) => {
        const next = { ...formValue, ...changes }
        if (value) onValueChange?.(next)
        else setInternalValue(next)
    }
    return (
        <div className="form-stack">
            <FormSection title="Datos de la oferta académica">
                <FormGrid>
                    <FormField label="Nombre de la oferta académica" required>
                        <input name="courseName" className="form-input" type="text" value={formValue.name} onChange={(event) => update({ name: event.target.value })} placeholder="Ej: Inglés General" />
                    </FormField>

                </FormGrid>
            </FormSection>

            <FormSection title="Descripción de la oferta académica" description="Información académica del programa.">
                <FormField label="Descripción">
                    <textarea
                        className="form-input form-textarea"
                        rows={5}
                        value={formValue.description}
                        onChange={(event) => update({ description: event.target.value })}
                        placeholder="Ej: Oferta académica orientada a nivel inicial con foco en speaking y listening."
                    />
                </FormField>
                <FormField label="Estado"><SearchableSelect value={formValue.status} options={statusOptions} onChange={(status) => update({ status: status as CourseFormValue['status'] })} /></FormField>
            </FormSection>
        </div>
    )
}
