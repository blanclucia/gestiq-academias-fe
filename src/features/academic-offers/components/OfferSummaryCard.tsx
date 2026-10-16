import { BookOpenCheck, Save } from 'lucide-react'
import { useRef, useState } from 'react'
import { markInvalidFields } from '@/components/forms/markInvalidFields'
import { validateConditions } from '@/components/forms/formValidation'
import { SettingsField as Field } from '@/components/forms/SettingsControls'
import { Card } from '@/components/ui/Card'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { StatusHelp } from '@/components/ui/StatusHelp'
import type { AcademicCourse } from '@/services/academyRepository'
import { courseStatusHelp } from '../model/courseStatusHelp'

type OfferChanges = Pick<AcademicCourse, 'name' | 'description' | 'status'>

type OfferSummaryCardProps = {
    course: AcademicCourse
    saving: boolean
    onSave: (changes: OfferChanges) => Promise<boolean>
}

const statusOptions = [{ value: 'Borrador', label: 'Borrador' }, { value: 'Activo', label: 'Activo' }, { value: 'Cerrado', label: 'Cerrado' }]

// Editable general info of an offer, same pattern as Mis sedes: the data is the form, saved from the
// footer (always visible; Guardar enables once there are changes). The parent remounts it (key)
// when the saved offer changes, so the draft restarts from it.
export function OfferSummaryCard({ course, saving, onSave }: OfferSummaryCardProps) {
    const saved: OfferChanges = { name: course.name, description: course.description ?? '', status: course.status }
    const [draft, setDraft] = useState<OfferChanges>(saved)
    const [error, setError] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)
    const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
    const update = (changes: Partial<OfferChanges>) => { setDraft((current) => ({ ...current, ...changes })); setError('') }

    const save = async () => {
        const message = markInvalidFields(containerRef.current, validateConditions({ courseName: !draft.name.trim() && 'Ingresá el nombre de la oferta.' }))
        if (message) { setError(message); return }
        const ok = await onSave({ ...draft, name: draft.name.trim(), description: draft.description?.trim() })
        if (!ok) setError('No se pudieron guardar los cambios. Intentá nuevamente.')
    }

    return <div className="offer-detail-stack" ref={containerRef}>
        <Card className="offer-summary-card">
            <SectionHeading icon={<BookOpenCheck size={20} />} title="Información general" description="Datos generales de esta oferta académica." />
            <div className="form-grid academy-settings-grid">
                <Field label="Nombre" required><input name="courseName" className="form-input" value={draft.name} onChange={(event) => update({ name: event.target.value })} placeholder="Ej: Inglés General" /></Field>
                <Field label="Estado" info={<StatusHelp label="Qué significa cada estado" items={courseStatusHelp} />}><SearchableSelect value={draft.status} onChange={(status) => update({ status: status as OfferChanges['status'] })} options={statusOptions} /></Field>
                <Field label="Descripción" full><textarea className="form-input form-textarea" rows={4} value={draft.description} onChange={(event) => update({ description: event.target.value })} placeholder="Contá de qué se trata la oferta, a quién está dirigida y qué incluye." /></Field>
            </div>
        </Card>
        {error && <p className="form-error-message" role="alert">{error}</p>}
        <div className="academy-form-actions">
            {dirty && <button type="button" className="secondary-button" onClick={() => { setDraft(saved); setError(''); markInvalidFields(containerRef.current, { valid: true }) }}>Descartar cambios</button>}
            <button type="button" className="primary-button academy-save-button" disabled={!dirty || saving} onClick={() => { void save() }}><Save size={16} />{saving ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
    </div>
}
