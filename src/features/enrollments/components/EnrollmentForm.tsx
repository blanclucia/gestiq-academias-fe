import { FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { StatusHelp } from '@/components/ui/StatusHelp'
import { useState } from 'react'
import type { AcademicCommission } from '@/services/academyRepository'
import { enrollmentStatusHelp } from '../model/enrollmentStatusHelp'
import { EligibleCommissionsPicker } from './EligibleCommissionsPicker'

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
    const copyLink = async () => {
        if (!publicLink) return
        try { await navigator.clipboard.writeText(publicLink); setCopyFeedback('¡Copiado!') } catch { setCopyFeedback('No se pudo copiar') }
    }

    return <div className="form-stack">
        <FormSection title={`Inscripción para ${courseName}`} description="Definí la ventana de inscripción y elegí qué comisiones querés ofrecer.">
            <FormGrid>
                <FormField label="Costo de la inscripción" required><input name="enrollmentAmount" className="form-input" type="number" value={formValue.amount} onChange={(event) => update({ amount: Number(event.target.value || 0) })} min={0} step={1000} /></FormField>
                <FormField label="Estado" info={<StatusHelp label="Qué significa cada estado" items={enrollmentStatusHelp} />}><SearchableSelect value={formValue.status} onChange={(status) => update({ status: status as EnrollmentFormValue['status'] })} options={[{ value: 'Abierta', label: 'Abierta' }, { value: 'Programada', label: 'Programada' }]} /></FormField>
                <FormField label="Fecha de inicio" required><input name="enrollmentStartDate" className="form-input" type="date" value={formValue.startDate} onChange={(event) => update({ startDate: event.target.value })} /></FormField>
                <FormField label="Fecha de cierre" required><input name="enrollmentEndDate" className="form-input" type="date" value={formValue.endDate} onChange={(event) => update({ endDate: event.target.value })} /></FormField>
                <FormField label="Link de autoinscripción">{publicLink ? <div className="enrollment-link-field"><input className="form-input" value={publicLink} readOnly /><button type="button" className="secondary-button compact-button" onClick={() => void copyLink()}>{copyFeedback}</button></div> : <div className="form-field-note">Se genera al guardar la inscripción.</div>}</FormField>
            </FormGrid>
            <EligibleCommissionsPicker commissions={commissions} startDate={formValue.startDate} value={formValue.commissionIds} onChange={(commissionIds) => update({ commissionIds })} />
        </FormSection>
    </div>
}
