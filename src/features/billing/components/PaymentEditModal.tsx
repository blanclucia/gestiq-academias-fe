import { EntityFormModal, FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { validatePaymentEdit } from '../model/billingValidation'
import type { Payment } from '@/types/domain'

type EditTarget = Pick<Payment, 'student' | 'concept'>
export type PaymentEditValue = { method: Payment['method']; amount: number; dueDate: string; status: Payment['status'] }

export function PaymentEditModal({ open, target, value, onChange, onClose, onSubmit }: { open: boolean; target: EditTarget | null; value: PaymentEditValue; onChange: (value: PaymentEditValue) => void; onClose: () => void; onSubmit: () => void }) {
    return <EntityFormModal open={open} title="Editar pago" subtitle="Actualiza la información del cobro." validate={() => validatePaymentEdit(value)} onClose={onClose} onSubmit={onSubmit}>
        <div className="form-stack"><FormSection title="Datos del pago"><FormGrid>
            <FormField label="Alumno"><input className="form-input" type="text" value={target?.student ?? ''} readOnly /></FormField>
            <FormField label="Concepto"><input className="form-input" type="text" value={target?.concept ?? ''} readOnly /></FormField>
            <FormField label="Método"><select className="form-input" value={value.method} onChange={(event) => onChange({ ...value, method: event.target.value as Payment['method'] })}><option value="Transferencia">Transferencia</option><option value="Tarjeta">Tarjeta</option><option value="Efectivo">Efectivo</option></select></FormField>
            <FormField label="Monto"><input name="editAmount" className="form-input" type="number" value={value.amount} min={0} onChange={(event) => onChange({ ...value, amount: Number(event.target.value || 0) })} /></FormField>
            <FormField label="Vencimiento"><input name="editDueDate" className="form-input" type="date" value={value.dueDate} onChange={(event) => onChange({ ...value, dueDate: event.target.value })} /></FormField>
            <FormField label="Estado"><select className="form-input" value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value as Payment['status'] })}><option value="Pagado">Pagado</option><option value="Pendiente">Pendiente</option><option value="En verificación">En verificación</option><option value="Rechazado">Rechazado</option></select></FormField>
        </FormGrid></FormSection></div>
    </EntityFormModal>
}
