import { FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { useState } from 'react'

export type CourseFormValue = { name: string; duration: string; description: string; status: 'Activo' | 'Borrador' | 'Cerrado' }

export function CourseForm({ initialValues, value, onValueChange }: {
    initialValues?: {
        name?: string
        duration?: string
        description?: string
    }
    value?: CourseFormValue
    onValueChange?: (value: CourseFormValue) => void
}) {
    const [internalValue, setInternalValue] = useState<CourseFormValue>({ name: initialValues?.name ?? '', duration: initialValues?.duration ?? '', description: initialValues?.description ?? '', status: 'Borrador' })
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
                        <input className="form-input" type="text" value={formValue.name} onChange={(event) => update({ name: event.target.value })} placeholder="Ej: Inglés General" />
                    </FormField>

                    <FormField label="Duración">
                        <input className="form-input" type="text" value={formValue.duration} onChange={(event) => update({ duration: event.target.value })} placeholder="Ej: 12 semanas" />
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
                <FormField label="Estado"><select className="form-input" value={formValue.status} onChange={(event) => update({ status: event.target.value as CourseFormValue['status'] })}><option value="Borrador">Borrador</option><option value="Activo">Activo</option><option value="Cerrado">Cerrado</option></select></FormField>
            </FormSection>
        </div>
    )
}
