import { useState } from 'react'
import { EntityFormModal, FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { validateConditions } from '@/components/forms/formValidation'
import { useToast } from '@/components/ui/ToastContext'
import { useCreateStaffMember } from '@/services/academyRepository'
import { isMemberConflict } from '@/services/organization/membersApi'

const dniPattern = /^[0-9]{7,8}$/

const emptyForm = { firstName: '', lastName: '', email: '', dni: '', specialty: '' }

type QuickCreateTeacherModalProps = {
    open: boolean
    onClose: () => void
    onCreated: (fullName: string) => void
}

// A lighter alternative to the full staff form (StaffPage.tsx) for when a commission is being
// created and no teacher exists yet — creates a Docente profile (with a real backend user) without
// leaving the commission form. The person still isn't assigned to any sede after this; that's done
// afterward from Sedes → la sede → tab Staff, same as any other staff member.
export function QuickCreateTeacherModal({ open, onClose, onCreated }: QuickCreateTeacherModalProps) {
    const { showToast } = useToast()
    const createStaffMember = useCreateStaffMember()
    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')

    const close = () => {
        setForm(emptyForm)
        setError('')
        onClose()
    }

    return (
        <EntityFormModal
            open={open}
            title="Nuevo profesor"
            subtitle="Alta rápida para poder asignarlo a esta comisión."
            submitLabel="Crear profesor"
            validate={() => validateConditions({
                teacherFirstName: !form.firstName.trim() && 'Ingresá el nombre.',
                teacherLastName: !form.lastName.trim() && 'Ingresá el apellido.',
                teacherEmail: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && 'Ingresá un email válido.',
                teacherDni: !dniPattern.test(form.dni.trim()) && 'Ingresá un DNI válido (7 u 8 dígitos, sin puntos).',
            }, 'Revisá los datos del profesor.')}
            onClose={close}
            onSubmit={() => {
                createStaffMember.mutate({
                    firstName: form.firstName.trim(),
                    lastName: form.lastName.trim(),
                    fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
                    email: form.email.trim(),
                    phone: '',
                    specialty: form.specialty.trim(),
                    dni: form.dni.trim(),
                    role: 'Docente',
                    status: 'Activo',
                    isAdministrator: false,
                }, {
                    onSuccess: (created) => {
                        onCreated(created.fullName)
                        showToast('success', 'Profesor creado correctamente.')
                        close()
                    },
                    onError: (mutationError) => setError(isMemberConflict(mutationError) ? 'Ya existe un miembro con ese DNI en esta organización.' : 'No se pudo crear el profesor. Intentá nuevamente.'),
                })
            }}
        >
            <div className="form-stack">
                <FormSection title="Datos del profesor">
                    <FormGrid>
                        <FormField label="Nombre" required>
                            <input name="teacherFirstName" className="form-input" type="text" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
                        </FormField>
                        <FormField label="Apellido" required>
                            <input name="teacherLastName" className="form-input" type="text" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
                        </FormField>
                        <FormField label="Email" required hint="Se va a crear un usuario del sistema para esta persona con estos datos — completalo con cuidado.">
                            <input name="teacherEmail" className="form-input" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
                        </FormField>
                        <FormField label="DNI" required hint="Sin puntos ni espacios. No queda asignado a ninguna sede todavía — eso se hace después desde Sedes → Staff.">
                            <input name="teacherDni" className="form-input" type="text" inputMode="numeric" value={form.dni} onChange={(event) => setForm((current) => ({ ...current, dni: event.target.value.replace(/\D/g, '').slice(0, 8) }))} />
                        </FormField>
                        <FormField label="Especialidad o área">
                            <input className="form-input" type="text" value={form.specialty} onChange={(event) => setForm((current) => ({ ...current, specialty: event.target.value }))} placeholder="Ej. Inglés, Administración" />
                        </FormField>
                    </FormGrid>
                    {error && <p style={{ margin: 0, color: 'var(--red)', fontSize: 13 }}>{error}</p>}
                </FormSection>
            </div>
        </EntityFormModal>
    )
}
