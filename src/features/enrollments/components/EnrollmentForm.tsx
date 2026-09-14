import { CalendarDays, Clock3 } from 'lucide-react'
import { FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { useState } from 'react'
import type { AcademicCommission } from '@/services/academyRepository'
import { getEligibleCommissions } from '@/domain/commissions/commissionRules'

export type EnrollmentFormValue = {
    courseId: string
    commissionIds: string[]
    amount: number
    startDate: string
    endDate: string
    status: 'Abierta' | 'Programada' | 'Cerrada'
}

export function EnrollmentForm({ courseName, commissions = [], initialValues, value, onValueChange, publicLink }: {
    courseName: string
    commissions?: AcademicCommission[]
    initialValues?: Partial<EnrollmentFormValue>
    value?: EnrollmentFormValue
    onValueChange?: (value: EnrollmentFormValue) => void
    publicLink?: string
}) {
    const [copyFeedback, setCopyFeedback] = useState('Copiar')
    const [internalValue, setInternalValue] = useState<EnrollmentFormValue>(() => value ?? {
        courseId: initialValues?.courseId ?? '', commissionIds: initialValues?.commissionIds ?? [], amount: initialValues?.amount ?? 48000,
        startDate: initialValues?.startDate ?? '2026-08-26', endDate: initialValues?.endDate ?? '2026-08-30', status: initialValues?.status ?? 'Abierta',
    })
    const formValue = value ?? internalValue
    const update = (changes: Partial<EnrollmentFormValue>) => {
        const next = { ...formValue, ...changes }
        if (value) onValueChange?.(next); else setInternalValue(next)
    }
    const eligibleCommissions = getEligibleCommissions(commissions, formValue.startDate, formValue.endDate)
    const selectedEligibleCount = eligibleCommissions.filter((commission) => formValue.commissionIds.includes(commission.id)).length
    const copyLink = async () => {
        if (!publicLink) return
        try { await navigator.clipboard.writeText(publicLink); setCopyFeedback('¡Copiado!') } catch { setCopyFeedback('No se pudo copiar') }
    }

    return <div className="form-stack">
        <FormSection title={`Inscripción para ${courseName}`} description="Definí la ventana de inscripción y elegí qué comisiones querés ofrecer.">
            <FormGrid>
                <FormField label="Costo de la inscripción" required><input name="enrollmentAmount" className="form-input" type="number" value={formValue.amount} onChange={(event) => update({ amount: Number(event.target.value || 0) })} min={0} step={1000} /></FormField>
                <FormField label="Estado"><select className="form-input" value={formValue.status} onChange={(event) => update({ status: event.target.value as EnrollmentFormValue['status'] })}><option value="Abierta">Abierta</option><option value="Programada">Programada</option><option value="Cerrada">Cerrada</option></select></FormField>
                <FormField label="Fecha de inicio" required><input name="enrollmentStartDate" className="form-input" type="date" value={formValue.startDate} onChange={(event) => update({ startDate: event.target.value })} /></FormField>
                <FormField label="Fecha de cierre" required><input name="enrollmentEndDate" className="form-input" type="date" value={formValue.endDate} onChange={(event) => update({ endDate: event.target.value })} /></FormField>
                <FormField label="Link de autoinscripción">{publicLink ? <div className="enrollment-link-field"><input className="form-input" value={publicLink} readOnly /><button type="button" className="secondary-button compact-button" onClick={() => void copyLink()}>{copyFeedback}</button></div> : <div className="form-field-note">Se genera al guardar la inscripción.</div>}</FormField>
            </FormGrid>
            <div className="eligible-commissions"><div><strong>Comisiones incluidas</strong><span>{selectedEligibleCount} de {eligibleCommissions.length} seleccionadas</span></div>{eligibleCommissions.map((commission) => <label className="eligible-commission-row" key={commission.id}><input name="enrollmentCommissions" type="checkbox" checked={formValue.commissionIds.includes(commission.id)} onChange={(event) => update({ commissionIds: event.target.checked ? [...formValue.commissionIds, commission.id] : formValue.commissionIds.filter((id) => id !== commission.id) })} /><CalendarDays size={16} /><span><strong>{commission.name}</strong><small><Clock3 size={13} />{commission.schedule} · {commission.studentsCount}/{commission.capacity} alumnos</small></span></label>)}{eligibleCommissions.length === 0 && <p>No hay comisiones vigentes entre las fechas seleccionadas.</p>}{eligibleCommissions.length > 0 && selectedEligibleCount === 0 && <p className="form-field-error">Seleccioná al menos una comisión para publicar la inscripción.</p>}</div>
        </FormSection>
    </div>
}
