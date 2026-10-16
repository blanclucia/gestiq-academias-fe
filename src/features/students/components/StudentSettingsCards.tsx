import { NotebookPen, Save, ShieldCheck, UserRound } from 'lucide-react'
import { useRef, useState } from 'react'
import { markInvalidFields } from '@/components/forms/markInvalidFields'
import { SettingsField as Field } from '@/components/forms/SettingsControls'
import { Card } from '@/components/ui/Card'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { isMinor } from '@/domain/students/studentRules'
import { normalizeDocument, normalizePersonName } from '@/domain/people/personRules'
import type { Student } from '@/types/domain'
import { toStudentDetailValue } from '../model/studentDetailValue'
import { validateStudentDetail, type StudentDetailValue } from '../model/studentValidation'


type Props = {
    student: Student
    saving: boolean
    // Resolves to an error message, or null when saved.
    onSave: (changes: Omit<StudentDetailValue, 'status'>) => Promise<string | null>
}

// Editable detail of a student, same pattern as the offer and commission details: the data is the
// form, saved from the footer. The status is not a field: pausing or reactivating is an action in the
// page header. The parent remounts it (key) when the saved student changes.
export function StudentSettingsCards({ student, saving, onSave }: Props) {
    const saved = toStudentDetailValue(student)
    const [draft, setDraft] = useState<StudentDetailValue>(saved)
    const [error, setError] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)
    const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
    const update = (changes: Partial<StudentDetailValue>) => { setDraft((current) => ({ ...current, ...changes })); setError('') }
    // The tutor card shows for a minor, or whenever there is tutor data to keep editing.
    const showTutor = isMinor(draft.birthDate || undefined) || Boolean(saved.tutorName || saved.tutorEmail || saved.tutorPhone)

    const save = async () => {
        const message = markInvalidFields(containerRef.current, validateStudentDetail(draft))
        if (message) { setError(message); return }
        const failure = await onSave({
            firstName: normalizePersonName(draft.firstName), lastName: normalizePersonName(draft.lastName), document: normalizeDocument(draft.document),
            birthDate: draft.birthDate, email: draft.email.trim(), phone: draft.phone.trim(), notes: draft.notes.trim(),
            tutorName: normalizePersonName(draft.tutorName), tutorEmail: draft.tutorEmail.trim(), tutorPhone: draft.tutorPhone.trim(),
        })
        if (failure) setError(failure)
    }

    return <div className="offer-detail-stack" ref={containerRef}>
        <Card>
            <SectionHeading icon={<UserRound size={20} />} title="Datos personales" description="Identificación y contacto del alumno." />
            <div className="form-grid academy-settings-grid">
                <Field label="Nombre" required><input name="studentFirstName" className="form-input" value={draft.firstName} onChange={(event) => update({ firstName: event.target.value })} onBlur={() => update({ firstName: normalizePersonName(draft.firstName) })} /></Field>
                <Field label="Apellido" required><input name="studentLastName" className="form-input" value={draft.lastName} onChange={(event) => update({ lastName: event.target.value })} onBlur={() => update({ lastName: normalizePersonName(draft.lastName) })} /></Field>
                <Field label="DNI" required><input name="studentDocument" className="form-input" inputMode="numeric" value={draft.document} onChange={(event) => update({ document: event.target.value })} onBlur={() => update({ document: normalizeDocument(draft.document) })} placeholder="Ej: 32.108.901" /></Field>
                <Field label="Fecha de nacimiento"><input name="studentBirthDate" className="form-input" type="date" max={new Date().toLocaleDateString('sv-SE')} value={draft.birthDate} onChange={(event) => update({ birthDate: event.target.value })} /></Field>
                <Field label="Email"><input name="studentEmail" className="form-input" type="email" value={draft.email} onChange={(event) => update({ email: event.target.value })} placeholder="lucia@email.com" /></Field>
                <Field label="Teléfono"><input name="studentPhone" className="form-input" type="tel" value={draft.phone} onChange={(event) => update({ phone: event.target.value })} placeholder="+54 11 1234-5678" /></Field>
            </div>
        </Card>
        {showTutor && <Card>
            <SectionHeading icon={<ShieldCheck size={20} />} title="Tutor o responsable" description="Contacto principal mientras el alumno sea menor de edad." />
            <div className="form-grid academy-settings-grid">
                <Field label="Nombre y apellido" required={isMinor(draft.birthDate || undefined)}><input name="studentTutorName" className="form-input" value={draft.tutorName} onChange={(event) => update({ tutorName: event.target.value })} onBlur={() => update({ tutorName: normalizePersonName(draft.tutorName) })} /></Field>
                <Field label="Email"><input name="studentTutorEmail" className="form-input" type="email" value={draft.tutorEmail} onChange={(event) => update({ tutorEmail: event.target.value })} /></Field>
                <Field label="Teléfono"><input name="studentTutorPhone" className="form-input" type="tel" value={draft.tutorPhone} onChange={(event) => update({ tutorPhone: event.target.value })} /></Field>
            </div>
        </Card>}
        <Card>
            <SectionHeading icon={<NotebookPen size={20} />} title="Notas internas" description="Observaciones de seguimiento; el alumno no las ve." />
            <div className="form-grid academy-settings-grid">
                <Field label="Notas" full><textarea name="studentNotes" className="form-textarea" rows={4} value={draft.notes} onChange={(event) => update({ notes: event.target.value })} placeholder="Ej: prefiere que lo contacten por WhatsApp." /></Field>
            </div>
        </Card>
        {error && <p className="form-error-message" role="alert">{error}</p>}
        <div className="academy-form-actions">
            {dirty && <button type="button" className="secondary-button" onClick={() => { setDraft(saved); setError(''); markInvalidFields(containerRef.current, { valid: true }) }}>Descartar cambios</button>}
            <button type="button" className="primary-button academy-save-button" disabled={!dirty || saving} onClick={() => void save()}><Save size={16} />{saving ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
    </div>
}
