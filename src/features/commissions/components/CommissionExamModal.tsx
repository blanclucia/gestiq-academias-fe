import { Check } from 'lucide-react'
import { EntityFormModal, FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { validateExamination } from '@/features/examinations'
import type { CommissionStudentRow } from './CommissionStudentsTable'
import { getActiveExamStudents } from '@/domain/examinations/examinationRules'

export type CommissionExamFormValue = { title: string; examDate: string; firstPaymentDueDate: string; feeAmount: string; installmentCount: string }
export type CommissionExamAudience = 'all' | 'selected'

type Props = { open: boolean; editing: boolean; value: CommissionExamFormValue; students: CommissionStudentRow[]; selectedStudentIds: string[]; audience: CommissionExamAudience; search: string; onChange: (value: CommissionExamFormValue) => void; onAudienceChange: (value: CommissionExamAudience) => void; onSearchChange: (value: string) => void; onSelectedStudentsChange: (ids: string[]) => void; onClose: () => void; onSubmit: () => void }

export function CommissionExamModal(props: Props) {
    const activeStudents = getActiveExamStudents(props.students)
    const visibleStudents = activeStudents.filter((student) => student.name.toLocaleLowerCase('es-AR').includes(props.search.toLocaleLowerCase('es-AR')))
    const update = (changes: Partial<CommissionExamFormValue>) => props.onChange({ ...props.value, ...changes })
    return <EntityFormModal open={props.open} title={props.editing ? 'Editar examen de comisión' : 'Nuevo examen de comisión'} subtitle={props.editing ? 'Los cargos pendientes se actualizarán. Los pagos ya registrados se conservarán.' : 'Al guardar se generarán automáticamente los cargos pendientes de los alumnos seleccionados.'} submitLabel={props.editing ? 'Guardar cambios' : 'Crear examen y cargos'} validate={() => validateExamination(props.value, props.audience === 'all' ? activeStudents.length : props.selectedStudentIds.length, props.editing)} onClose={props.onClose} onSubmit={props.onSubmit}>
        <div className="form-stack">
            <FormSection title="Datos del examen"><FormGrid>
                <FormField label="Nombre" required><input name="examTitle" className="form-input" value={props.value.title} onChange={(event) => update({ title: event.target.value })} /></FormField>
                <FormField label="Fecha del examen" required><input name="examDate" className="form-input" type="date" value={props.value.examDate} onChange={(event) => update({ examDate: event.target.value })} /></FormField>
                <FormField label="Primer vencimiento de pago" required><input name="examDueDate" className="form-input" type="date" value={props.value.firstPaymentDueDate} onChange={(event) => update({ firstPaymentDueDate: event.target.value })} /></FormField>
                <FormField label="Arancel total por alumno" required><input name="examFeeAmount" className="form-input" type="number" min={1} value={props.value.feeAmount} onChange={(event) => update({ feeAmount: event.target.value })} /></FormField>
                <FormField label="Cantidad de cuotas" required><input name="examInstallments" className="form-input" type="number" min={1} max={12} disabled={props.editing} value={props.value.installmentCount} onChange={(event) => update({ installmentCount: event.target.value })} /></FormField>
            </FormGrid></FormSection>
            {!props.editing && <FormSection title="Alumnos que rinden"><div style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}><button type="button" className={`exam-audience-option ${props.audience === 'all' ? 'selected' : ''}`} onClick={() => props.onAudienceChange('all')}><strong>Todos los activos</strong><small>{activeStudents.length} alumnos</small></button><button type="button" className={`exam-audience-option ${props.audience === 'selected' ? 'selected' : ''}`} onClick={() => props.onAudienceChange('selected')}><strong>Seleccionar</strong><small>{props.selectedStudentIds.length} seleccionados</small></button></div>
                {props.audience === 'selected' && <><div className="exam-selected-summary"><strong>{props.selectedStudentIds.length} alumno{props.selectedStudentIds.length === 1 ? '' : 's'} seleccionado{props.selectedStudentIds.length === 1 ? '' : 's'}</strong></div><input className="form-input" value={props.search} onChange={(event) => props.onSearchChange(event.target.value)} placeholder="Buscar y agregar alumno" /><div className="exam-student-results">{visibleStudents.map((student) => { const selected = props.selectedStudentIds.includes(student.id); return <button type="button" className={`exam-student-option ${selected ? 'selected' : ''}`} key={student.id} onClick={() => props.onSelectedStudentsChange(selected ? props.selectedStudentIds.filter((id) => id !== student.id) : [...props.selectedStudentIds, student.id])}><span>{student.name}</span>{selected && <Check size={15} />}</button> })}{visibleStudents.length === 0 && <small style={{ color: 'var(--muted)' }}>No encontramos alumnos activos.</small>}</div></>}
                <div className="exam-payment-note">Se generarán automáticamente los pagos pendientes para los alumnos seleccionados. La primera cuota vencerá en la fecha indicada y las siguientes se programarán mensualmente.</div>
            </div></FormSection>}
        </div>
    </EntityFormModal>
}
