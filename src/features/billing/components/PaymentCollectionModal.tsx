import { EntityFormModal, FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { validatePaymentCollection } from '../model/billingValidation'
import type { Payment } from '@/types/domain'

type CollectionTarget = Pick<Payment, 'student' | 'concept'>
export type PaymentCollectionValue = { date: string; method: Payment['method'] }

export function PaymentCollectionModal({ target, value, onChange, onClose, onSubmit }: { target: CollectionTarget | null; value: PaymentCollectionValue; onChange: (value: PaymentCollectionValue) => void; onClose: () => void; onSubmit: () => void }) {
    return <EntityFormModal open={Boolean(target)} title="Registrar cobro" subtitle="Confirmá fecha y medio de pago para impactar la cobranza." submitLabel="Registrar" validate={() => validatePaymentCollection(value)} onClose={onClose} onSubmit={onSubmit}>
        <div className="form-stack"><FormSection title="Confirmación del cobro"><FormGrid>
            <FormField label="Alumno"><input className="form-input" type="text" value={target?.student ?? ''} readOnly /></FormField>
            <FormField label="Concepto"><input className="form-input" type="text" value={target?.concept ?? ''} readOnly /></FormField>
            <FormField label="Fecha de cobro"><input name="collectionDate" className="form-input" type="date" value={value.date} onChange={(event) => onChange({ ...value, date: event.target.value })} /></FormField>
            <FormField label="Medio de pago"><select className="form-input" value={value.method} onChange={(event) => onChange({ ...value, method: event.target.value as Payment['method'] })}><option value="Transferencia">Transferencia</option><option value="Tarjeta">Tarjeta</option><option value="Efectivo">Efectivo</option></select></FormField>
        </FormGrid></FormSection></div>
    </EntityFormModal>
}
