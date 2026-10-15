import { CalendarDays, ClipboardList, Save } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { markInvalidFields } from '@/components/forms/markInvalidFields'
import { SettingsField as Field } from '@/components/forms/SettingsControls'
import { Card } from '@/components/ui/Card'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { StatusHelp } from '@/components/ui/StatusHelp'
import { getEligibleCommissions } from '@/domain/commissions/commissionRules'
import type { AcademicCommission, EnrollmentOpening } from '@/services/academyRepository'
import { enrollmentStatusHelp } from '../model/enrollmentStatusHelp'
import { validateEnrollment } from '../model/enrollmentValidation'
import type { EnrollmentFormValue } from './EnrollmentForm'
import { EligibleCommissionsPicker } from './EligibleCommissionsPicker'
import { EnrollmentPaymentMethodsNotice } from './EnrollmentPaymentMethodsNotice'

type EnrollmentDraft = Omit<EnrollmentFormValue, 'courseId'>

// Closing/reopening is an explicit action in the page header (with a confirmation), not a field edit.
const editableStatusOptions = [{ value: 'Programada', label: 'Programada' }, { value: 'Abierta', label: 'Abierta' }]
const closedStatusOptions = [{ value: 'Cerrada', label: 'Cerrada' }]

type Props = {
    opening: EnrollmentOpening
    commissions: AcademicCommission[]
    // Branch of the offer: shows the payment methods the public form will offer.
    branchId: string
    saving: boolean
    onSave: (changes: EnrollmentDraft) => Promise<boolean>
    // Rendered right after Datos de la inscripción (the share card), so the save footer still closes the tab.
    afterData?: ReactNode
}

// Editable detail of an enrollment, same pattern as the commission detail: the data is the form, saved
// from the footer. The parent remounts it (key) when the saved enrollment changes.
export function EnrollmentSettingsCards({ opening, commissions, branchId, saving, onSave, afterData }: Props) {
    const saved: EnrollmentDraft = {
        // Only the still-eligible commissions are editable; a closed or finished one drops out on save.
        commissionIds: getEligibleCommissions(commissions, opening.startDate, opening.commissionIds).map((commission) => commission.id),
        amount: opening.amount,
        startDate: opening.startDate,
        endDate: opening.endDate,
        status: opening.status,
    }
    const [draft, setDraft] = useState<EnrollmentDraft>(saved)
    const [error, setError] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)
    const closed = opening.status === 'Cerrada'
    const eligibleCount = getEligibleCommissions(commissions, draft.startDate).length
    const selectedCount = getEligibleCommissions(commissions, draft.startDate, draft.commissionIds).length
    const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
    const update = (changes: Partial<EnrollmentDraft>) => { setDraft((current) => ({ ...current, ...changes })); setError('') }

    const save = async () => {
        const message = markInvalidFields(containerRef.current, validateEnrollment({ courseId: opening.courseId, ...draft }, commissions))
        if (message) { setError(message); return }
        const ok = await onSave(draft)
        if (!ok) setError('No se pudieron guardar los cambios. Intentá nuevamente.')
    }

    return <div className="offer-detail-stack" ref={containerRef}>
        <Card>
            <SectionHeading icon={<ClipboardList size={20} />} title="Datos de la inscripción" description="Período en el que el link acepta inscripciones, costo y estado." />
            <div className="form-grid academy-settings-grid">
                <Field label="Fecha de inicio" required><input name="enrollmentStartDate" className="form-input" type="date" value={draft.startDate} onChange={(event) => update({ startDate: event.target.value })} /></Field>
                <Field label="Fecha de cierre" required><input name="enrollmentEndDate" className="form-input" type="date" min={draft.startDate} value={draft.endDate} onChange={(event) => update({ endDate: event.target.value })} /></Field>
                <Field label="Costo de la inscripción" required><input name="enrollmentAmount" className="form-input" type="number" min={0} step={1000} value={draft.amount} onChange={(event) => update({ amount: Number(event.target.value || 0) })} /></Field>
                <Field label="Estado" hint={closed ? 'Reabrila desde el botón de arriba.' : undefined} info={<StatusHelp label="Qué significa cada estado" items={enrollmentStatusHelp} />}><SearchableSelect value={draft.status} disabled={closed} onChange={(status) => update({ status: status as EnrollmentDraft['status'] })} options={closed ? closedStatusOptions : editableStatusOptions} /></Field>
            </div>
            <EnrollmentPaymentMethodsNotice branchId={branchId} amount={draft.amount} />
        </Card>
        {afterData}
        <Card>
            <SectionHeading icon={<CalendarDays size={20} />} title="Comisiones incluidas" description={`${selectedCount} de ${eligibleCount} seleccionadas · Abiertas y que no terminaron antes del inicio de la inscripción.`} />
            <EligibleCommissionsPicker commissions={commissions} startDate={draft.startDate} value={draft.commissionIds} onChange={(commissionIds) => update({ commissionIds })} showHeader={false} />
        </Card>
        {error && <p className="form-error-message" role="alert">{error}</p>}
        <div className="academy-form-actions">
            {dirty && <button type="button" className="secondary-button" onClick={() => { setDraft(saved); setError(''); markInvalidFields(containerRef.current, { valid: true }) }}>Descartar cambios</button>}
            <button type="button" className="primary-button academy-save-button" disabled={!dirty || saving} onClick={() => { void save() }}><Save size={16} />{saving ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
    </div>
}
