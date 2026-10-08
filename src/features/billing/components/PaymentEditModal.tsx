import { EntityFormModal, FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { validatePaymentEdit } from '../model/billingValidation'
import type { Payment } from '@/types/domain'

type EditTarget = Pick<Payment, 'student' | 'concept'>
export type PaymentEditValue = { method: Payment['method']; amount: number; dueDate: string; status: Payment['status'] }

export function PaymentEditModal({ open, target, value, onChange, onClose, onSubmit }: { open: boolean; target: EditTarget | null; value: PaymentEditValue; onChange: (value: PaymentEditValue) => void; onClose: () => void; onSubmit: () => void }) {
    return <EntityFormModal open={open} title="Editar pago" subtitle="Actualiza la información del cobro." validate={() => validatePaymentEdit(value)} onClose={onClose} onSubmit={onSubmit}>
        <div className="form-stack"><FormSection title="Datos del pago"><FormGrid>
            <FormField label="Alumno"><input className="form-input" type="text" value={target?.student ?? ''} readOnly /></FormField>
            <FormField label="Concepto"><input className="form-input" type="text" value={target?.concept ?? ''} readOnly /></FormField>
            <FormField label="Método"><SearchableSelect value={value.method} onChange={(method) => onChange({ ...value, method: method as Payment['method'] })} options={[{ value: 'Transferencia', label: 'Transferencia' }, { value: 'Tarjeta', label: 'Tarjeta' }, { value: 'Efectivo', label: 'Efectivo' }]} /></FormField>
            <FormField label="Monto"><input name="editAmount" className="form-input" type="number" value={value.amount} min={0} onChange={(event) => onChange({ ...value, amount: Number(event.target.value || 0) })} /></FormField>
            <FormField label="Vencimiento"><input name="editDueDate" className="form-input" type="date" value={value.dueDate} onChange={(event) => onChange({ ...value, dueDate: event.target.value })} /></FormField>
            <FormField label="Estado"><SearchableSelect value={value.status} onChange={(status) => onChange({ ...value, status: status as Payment['status'] })} options={[{ value: 'Pagado', label: 'Pagado' }, { value: 'Pendiente', label: 'Pendiente' }, { value: 'En verificación', label: 'En verificación' }, { value: 'Rechazado', label: 'Rechazado' }]} /></FormField>
        </FormGrid></FormSection></div>
    </EntityFormModal>
}
