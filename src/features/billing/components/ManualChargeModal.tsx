import { EntityFormModal, FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import type { Payment, Student } from '@/types/domain'
import { validateManualCharge } from '../model/billingValidation'

export type ManualChargeValue = {
    studentId: string
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

type ManualChargeModalProps = {
    open: boolean
    value: ManualChargeValue
    students: Pick<Student, 'id' | 'fullName' | 'document'>[]
    paymentMethods: Payment['method'][]
    onChange: (value: ManualChargeValue) => void
    onClose: () => void
    onSubmit: () => void | Promise<unknown>
}

export function ManualChargeModal({ open, value, students, paymentMethods, onChange, onClose, onSubmit }: ManualChargeModalProps) {
    const update = (changes: Partial<ManualChargeValue>) => onChange({ ...value, ...changes })

    return (
        <EntityFormModal
            open={open}
            title="Nuevo cobro"
            subtitle="Registrá un concepto extraordinario de un alumno: examen, material, certificado u otro."
            submitLabel={value.status === 'Pagado' ? 'Registrar ingreso' : 'Crear cobro pendiente'}
            validate={() => validateManualCharge(value)}
            onClose={onClose}
            onSubmit={onSubmit}
        >
            <div className="form-stack">
                <FormSection title="Concepto del cobro">
                    <FormGrid>
                        <FormField label="Categoría" required>
                            <SearchableSelect name="category" value={value.category} onChange={(category) => update({ category })} options={categories.map((category) => ({ value: category, label: category }))} />
                        </FormField>
                        <FormField label={value.category === 'Otro' ? 'Concepto' : 'Detalle (opcional)'} required={value.category === 'Otro'}>
                            <input name="detail" className="form-input" value={value.detail} onChange={(event) => update({ detail: event.target.value })} placeholder="Ej: Examen internacional B2" />
                        </FormField>
                        <FormField label="Importe" required>
                            <input name="amount" className="form-input" type="number" min={1} step={1000} value={value.amount} onChange={(event) => update({ amount: event.target.value })} />
                        </FormField>
                        <FormField label="Alumno" required>
                            <SearchableSelect name="studentId" value={value.studentId} options={students.map((student) => ({ value: student.id, label: `${student.fullName} · ${student.document}` }))} onChange={(studentId) => update({ studentId })} placeholder="Buscar alumno" emptyLabel="No encontramos alumnos." clearable clearLabel="Quitar alumno" />
                        </FormField>
                    </FormGrid>
                </FormSection>
                <FormSection title="Cobro" description="Si ya te pagaron, indicá cuándo y con qué medio; si no, queda pendiente con su vencimiento.">
                    <FormGrid>
                        {/* An explicit question instead of a "Status" select: the payment method only applies once
                            it was collected, and hiding it behind "Pagado" made it look missing. */}
                        <FormField label="¿Ya se cobró?">
                            <SearchableSelect value={value.status} onChange={(status) => update({ status: status as ManualChargeValue['status'] })} options={[{ value: 'Pendiente', label: 'No, queda pendiente' }, { value: 'Pagado', label: 'Sí, ya se cobró' }]} />
                        </FormField>
                        {value.status === 'Pendiente' ? (
                            <FormField label="Vencimiento" required><input name="dueDate" className="form-input" type="date" value={value.dueDate} onChange={(event) => update({ dueDate: event.target.value })} /></FormField>
                        ) : (
                            <>
                                <FormField label="Fecha de pago" required><input name="date" className="form-input" type="date" value={value.date} onChange={(event) => update({ date: event.target.value })} /></FormField>
                                <FormField label="Medio de pago" required><SearchableSelect value={value.method} onChange={(method) => update({ method: method as Payment['method'] })} options={paymentMethods.map((method) => ({ value: method, label: method }))} /></FormField>
                            </>
                        )}
                        <FormField label="Nota interna (opcional)"><input className="form-input" value={value.notes} onChange={(event) => update({ notes: event.target.value })} /></FormField>
                    </FormGrid>
                </FormSection>
            </div>
        </EntityFormModal>
    )
}
