import { EntityFormModal, FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { validatePaymentEdit } from '../model/billingValidation'
import type { Payment } from '@/types/domain'

type EditTarget = Pick<Payment, 'student' | 'concept'>
export type PaymentEditValue = { method: Payment['method']; amount: number; dueDate: string }

// Edits the data of a charge, not its status: collecting, confirming or rejecting a transfer and
// reverting a payment are explicit row actions, so a status change never skips its own data
// (payment date, method) or confirmation. The due date only matters while unpaid; the method once paid.
export function PaymentEditModal({ open, target, paid, value, paymentMethods, onChange, onClose, onSubmit }: { open: boolean; target: EditTarget | null; paid: boolean; value: PaymentEditValue; paymentMethods: Payment['method'][]; onChange: (value: PaymentEditValue) => void; onClose: () => void; onSubmit: () => void | Promise<unknown> }) {
    return <EntityFormModal open={open} title="Editar cobro" subtitle="Actualizá el importe y los datos del cobro." validate={() => validatePaymentEdit({ ...value, paid })} onClose={onClose} onSubmit={onSubmit}>
        <div className="form-stack"><FormSection title="Datos del cobro"><FormGrid>
            <FormField label="Alumno"><input className="form-input" type="text" value={target?.student ?? ''} readOnly /></FormField>
            <FormField label="Concepto"><input className="form-input" type="text" value={target?.concept ?? ''} readOnly /></FormField>
            <FormField label="Monto"><input name="editAmount" className="form-input" type="number" value={value.amount} min={0} onChange={(event) => onChange({ ...value, amount: Number(event.target.value || 0) })} /></FormField>
            {paid
                ? <FormField label="Medio de pago"><SearchableSelect value={value.method} onChange={(method) => onChange({ ...value, method: method as Payment['method'] })} options={paymentMethods.map((method) => ({ value: method, label: method }))} /></FormField>
                : <FormField label="Vencimiento"><input name="editDueDate" className="form-input" type="date" value={value.dueDate} onChange={(event) => onChange({ ...value, dueDate: event.target.value })} /></FormField>}
        </FormGrid></FormSection></div>
    </EntityFormModal>
}
