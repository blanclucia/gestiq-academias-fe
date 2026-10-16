import { FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { isMinor } from '@/domain/students/studentRules'

export type StudentFormValue = {
    firstName: string
    lastName: string
    document: string
    email: string
    phone: string
    birthDate: string
    status: 'Activo' | 'Pendiente' | 'Inactivo'
    notes: string
    tutorName: string
    tutorEmail: string
    tutorPhone: string
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
        tutorName?: string
        tutorEmail?: string
        tutorPhone?: string
    }
    value?: StudentFormValue
    onChange?: (value: StudentFormValue) => void
}) {
    const update = <K extends keyof StudentFormValue>(key: K, nextValue: StudentFormValue[K]) => onChange?.({ ...(value ?? fallback), [key]: nextValue })
    const fallback: StudentFormValue = {
        firstName: initialValues?.firstName ?? initialValues?.fullName?.split(' ')[0] ?? '',
        lastName: initialValues?.lastName ?? initialValues?.fullName?.split(' ').slice(1).join(' ') ?? '',
        document: initialValues?.document ?? '', email: initialValues?.email ?? '', phone: initialValues?.phone ?? '', birthDate: initialValues?.birthDate ?? '', status: initialValues?.status ?? 'Activo', notes: initialValues?.notes ?? '',
        tutorName: initialValues?.tutorName ?? '', tutorEmail: initialValues?.tutorEmail ?? '', tutorPhone: initialValues?.tutorPhone ?? '',
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
                        <input name="studentPhone" className="form-input" type="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+54 11 1234-5678" />
                    </FormField>

                    <FormField label="Fecha de nacimiento">
                        <input name="studentBirthDate" className="form-input" type="date" max={new Date().toLocaleDateString('sv-SE')} value={form.birthDate} onChange={(event) => update('birthDate', event.target.value)} />
                    </FormField>
                </FormGrid>
            </FormSection>

            {/* Like the public enrollment form: a minor comes with a tutor, the main contact. */}
            {isMinor(form.birthDate || undefined) && <FormSection title="Tutor o responsable" description="El alumno es menor de edad: cargá quién es su contacto principal.">
                <FormGrid>
                    <FormField label="Nombre y apellido" required>
                        <input name="studentTutorName" className="form-input" type="text" value={form.tutorName} onChange={(event) => update('tutorName', event.target.value)} placeholder="Ej: María Gómez" />
                    </FormField>
                    <FormField label="Email">
                        <input name="studentTutorEmail" className="form-input" type="email" value={form.tutorEmail} onChange={(event) => update('tutorEmail', event.target.value)} placeholder="maria@email.com" />
                    </FormField>
                    <FormField label="Teléfono">
                        <input name="studentTutorPhone" className="form-input" type="tel" value={form.tutorPhone} onChange={(event) => update('tutorPhone', event.target.value)} placeholder="+54 11 1234-5678" />
                    </FormField>
                </FormGrid>
            </FormSection>}

            <FormSection title="Estado y observaciones" description="Información base de seguimiento del estudiante.">
                <FormGrid>
                    <FormField label="Estado inicial">
                        <SearchableSelect value={form.status} onChange={(status) => update('status', status as StudentFormValue['status'])} options={[{ value: 'Activo', label: 'Activo' }, { value: 'Pendiente', label: 'Pendiente' }, { value: 'Inactivo', label: 'Inactivo' }]} />
                    </FormField>
                </FormGrid>

                <FormField label="Notas">
                    <textarea className="form-input form-textarea" rows={4} value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Ej: Necesita reforzar speaking, prefiere horario tarde..." />
                </FormField>
            </FormSection>
        </div>
    )
}
