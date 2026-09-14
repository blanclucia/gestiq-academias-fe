import { FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'

export type StudentFormValue = {
    firstName: string
    lastName: string
    document: string
    email: string
    phone: string
    birthDate: string
    status: 'Activo' | 'Pendiente' | 'Inactivo'
    notes: string
}

export function StudentForm({ initialValues, value, onChange }: {
    initialValues?: {
        fullName?: string
        firstName?: string
        lastName?: string
        document?: string
        email?: string
        phone?: string
        birthDate?: string
        status?: 'Activo' | 'Pendiente' | 'Inactivo'
        notes?: string
    }
    value?: StudentFormValue
    onChange?: (value: StudentFormValue) => void
}) {
    const update = <K extends keyof StudentFormValue>(key: K, nextValue: StudentFormValue[K]) => onChange?.({ ...(value ?? fallback), [key]: nextValue })
    const fallback: StudentFormValue = {
        firstName: initialValues?.firstName ?? initialValues?.fullName?.split(' ')[0] ?? '',
        lastName: initialValues?.lastName ?? initialValues?.fullName?.split(' ').slice(1).join(' ') ?? '',
        document: initialValues?.document ?? '', email: initialValues?.email ?? '', phone: initialValues?.phone ?? '', birthDate: initialValues?.birthDate ?? '', status: initialValues?.status ?? 'Activo', notes: initialValues?.notes ?? '',
    }
    const form = value ?? fallback
    return (
        <div className="form-stack">
            <FormSection title="Datos personales">
                <FormGrid>
                    <FormField label="Nombre" required>
                        <input name="studentFirstName" className="form-input" type="text" value={form.firstName} onChange={(event) => update('firstName', event.target.value)} placeholder="Ej: Lucía" />
                    </FormField>

                    <FormField label="Apellido" required>
                        <input name="studentLastName" className="form-input" type="text" value={form.lastName} onChange={(event) => update('lastName', event.target.value)} placeholder="Ej: Gómez" />
                    </FormField>

                    <FormField label="Documento" required>
                        <input name="studentDocument" className="form-input" type="text" value={form.document} onChange={(event) => update('document', event.target.value)} placeholder="Ej: 32.108.901" />
                    </FormField>

                    <FormField label="Email">
                        <input name="studentEmail" className="form-input" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="lucia@academia.com" />
                    </FormField>

                    <FormField label="Teléfono">
                        <input className="form-input" type="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+54 11 1234-5678" />
                    </FormField>

                    <FormField label="Fecha de nacimiento">
                        <input name="studentBirthDate" className="form-input" type="text" value={form.birthDate} onChange={(event) => update('birthDate', event.target.value)} placeholder="aaaa-mm-dd" />
                    </FormField>
                </FormGrid>
            </FormSection>

            <FormSection title="Estado y observaciones" description="Información base de seguimiento del estudiante.">
                <FormGrid>
                    <FormField label="Estado inicial">
                        <select className="form-input" value={form.status} onChange={(event) => update('status', event.target.value as StudentFormValue['status'])}>
                            <option value="Activo">Activo</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>
                    </FormField>
                </FormGrid>

                <FormField label="Notas">
                    <textarea className="form-input form-textarea" rows={4} value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Ej: Necesita reforzar speaking, prefiere horario tarde..." />
                </FormField>
            </FormSection>
        </div>
    )
}
