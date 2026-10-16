import { useState } from 'react'
import { EntityFormModal, FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { validateConditions } from '@/components/forms/formValidation'
import { isValidDni, isValidEmail, isValidPersonName, normalizeDocument, normalizePersonName } from '@/domain/people/personRules'
import { useToast } from '@/components/ui/ToastContext'
import { useCreateStaffMember } from '@/services/academyRepository'
import { useBranchRosterInvalidation, useSetBranchStaffScope } from '@/services/branchRepository'
import { isMemberConflict } from '@/services/organization/membersApi'
import { isStaffDniConflict } from '@/services/organization/staffApi'

// Typed freely, with or without dots, like a student's DNI: normalized on leaving the field and on save.
const isValidDniInput = (value: string) => isValidDni(normalizeDocument(value))

const emptyForm = { firstName: '', lastName: '', email: '', dni: '', specialty: '' }

type QuickCreateTeacherModalProps = {
    open: boolean
    onClose: () => void
    onCreated: (fullName: string) => void
    // Branch of the commission being edited: the new teacher is assigned to it right away, so they show
    // up in that branch's Staff and dashboard instead of floating in the organization unassigned.
    branchId?: string
}

// A lighter alternative to the full staff form (StaffPage.tsx) for when a commission is being
// created and no teacher exists yet — creates a Docente profile (with a real backend user) without
// leaving the commission form, and assigns it to the commission's branch (same as Sedes → Staff).
export function QuickCreateTeacherModal({ open, onClose, onCreated, branchId }: QuickCreateTeacherModalProps) {
    const { showToast } = useToast()
    const createStaffMember = useCreateStaffMember()
    const setBranchStaffScope = useSetBranchStaffScope()
    const invalidateBranchRoster = useBranchRosterInvalidation()
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
                teacherFirstName: !form.firstName.trim() ? 'Ingresá el nombre.' : !isValidPersonName(form.firstName.trim()) && 'El nombre solo puede tener letras.',
                teacherLastName: !form.lastName.trim() ? 'Ingresá el apellido.' : !isValidPersonName(form.lastName.trim()) && 'El apellido solo puede tener letras.',
                teacherEmail: !isValidEmail(form.email.trim()) && 'Ingresá un email válido.',
                teacherDni: !isValidDniInput(form.dni) && 'El DNI tiene que tener 7 u 8 números.',
            }, 'Revisá los datos del profesor.')}
            onClose={close}
            onSubmit={() => {
                createStaffMember.mutate({
                    // Capitalized like the backend stores it, so the commission shows it right away.
                    firstName: normalizePersonName(form.firstName),
                    lastName: normalizePersonName(form.lastName),
                    fullName: normalizePersonName(`${form.firstName} ${form.lastName}`),
                    email: form.email.trim(),
                    phone: '',
                    specialty: form.specialty.trim(),
                    dni: normalizeDocument(form.dni),
                    role: 'Docente',
                    status: 'Activo',
                    isAdministrator: false,
                }, {
                    onSuccess: (created) => {
                        onCreated(created.fullName)
                        close()
                        if (!branchId || !created.userId) {
                            showToast('success', 'Profesor creado correctamente.')
                            return
                        }
                        setBranchStaffScope.mutate({ branchId, userId: created.userId, enabled: true }, {
                            onSuccess: () => {
                                invalidateBranchRoster(branchId)
                                showToast('success', 'Profesor creado y asignado a la sede.')
                            },
                            onError: () => showToast('error', 'El profesor quedó creado, pero no se pudo asignar a la sede. Asignalo desde Sedes → Staff.'),
                        })
                    },
                    onError: (mutationError) => setError(isMemberConflict(mutationError) || isStaffDniConflict(mutationError) ? 'Ya existe un integrante con ese DNI en esta organización.' : 'No se pudo crear el profesor. Intentá nuevamente.'),
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
                            <input name="teacherDni" className="form-input" type="text" inputMode="numeric" value={form.dni} onChange={(event) => setForm((current) => ({ ...current, dni: event.target.value }))} onBlur={() => setForm((current) => ({ ...current, dni: normalizeDocument(current.dni) }))} placeholder="Ej: 32.108.901" />
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
