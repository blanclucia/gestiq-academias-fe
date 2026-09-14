import { EntityFormModal, FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import type { Payment, Student } from '@/types/domain'
import { validateManualCharge } from '../model/billingValidation'

export type ManualChargeValue = {
    student: string
    category: string
    detail: string
    amount: string
    status: 'Pendiente' | 'Pagado'
    method: Payment['method']
    dueDate: string
    date: string
    notes: string
}

const categories = ['Examen', 'Material', 'Certificado', 'Matrícula', 'Recuperatorio', 'Otro']
const paymentMethods: Payment['method'][] = ['Transferencia', 'Tarjeta', 'Efectivo']

type ManualChargeModalProps = {
    open: boolean
    value: ManualChargeValue
    students: Pick<Student, 'fullName' | 'document'>[]
    onChange: (value: ManualChargeValue) => void
    onClose: () => void
    onSubmit: () => void
}

export function ManualChargeModal({ open, value, students, onChange, onClose, onSubmit }: ManualChargeModalProps) {
    const update = (changes: Partial<ManualChargeValue>) => onChange({ ...value, ...changes })

    return (
        <EntityFormModal
            open={open}
            title="Nuevo cobro"
            subtitle="Registrá un concepto extraordinario, asociado o no a un alumno."
            submitLabel={value.status === 'Pagado' ? 'Registrar ingreso' : 'Crear cobro pendiente'}
            validate={() => validateManualCharge(value)}
            onClose={onClose}
            onSubmit={onSubmit}
        >
            <div className="form-stack">
                <FormSection title="Concepto del cobro">
                    <FormGrid>
                        <FormField label="Categoría" required>
                            <select name="category" className="form-input" value={value.category} onChange={(event) => update({ category: event.target.value })}>
                                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                            </select>
                        </FormField>
                        <FormField label={value.category === 'Otro' ? 'Concepto' : 'Detalle (opcional)'} required={value.category === 'Otro'}>
                            <input name="detail" className="form-input" value={value.detail} onChange={(event) => update({ detail: event.target.value })} placeholder="Ej: Examen internacional B2" />
                        </FormField>
                        <FormField label="Importe" required>
                            <input name="amount" className="form-input" type="number" min={1} step={1000} value={value.amount} onChange={(event) => update({ amount: event.target.value })} />
                        </FormField>
                        <FormField label="Alumno (opcional)">
                            <SearchableSelect value={value.student} options={[{ value: '', label: 'Sin alumno asociado' }, ...students.map((student) => ({ value: student.fullName, label: `${student.fullName} · ${student.document}` }))]} onChange={(student) => update({ student })} placeholder="Buscar alumno" emptyLabel="No encontramos alumnos." />
                        </FormField>
                    </FormGrid>
                </FormSection>
                <FormSection title="Estado y fecha">
                    <FormGrid>
                        <FormField label="Estado">
                            <select className="form-input" value={value.status} onChange={(event) => update({ status: event.target.value as ManualChargeValue['status'] })}>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Pagado">Pagado</option>
                            </select>
                        </FormField>
                        {value.status === 'Pendiente' ? (
                            <FormField label="Vencimiento" required><input name="dueDate" className="form-input" type="date" value={value.dueDate} onChange={(event) => update({ dueDate: event.target.value })} /></FormField>
                        ) : (
                            <>
                                <FormField label="Fecha de pago" required><input name="date" className="form-input" type="date" value={value.date} onChange={(event) => update({ date: event.target.value })} /></FormField>
                                <FormField label="Medio de pago" required><select className="form-input" value={value.method} onChange={(event) => update({ method: event.target.value as Payment['method'] })}>{paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}</select></FormField>
                            </>
                        )}
                        <FormField label="Nota interna (opcional)"><input className="form-input" value={value.notes} onChange={(event) => update({ notes: event.target.value })} /></FormField>
                    </FormGrid>
                </FormSection>
            </div>
        </EntityFormModal>
    )
}
