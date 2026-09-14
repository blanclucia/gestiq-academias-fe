import { EntityFormModal, FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { getPaymentDisplayDate } from '@/domain/billing/paymentRules'
import type { Payment } from '@/types/domain'
import { validatePaymentAdjustment } from '../model/billingValidation'

export type PaymentAdjustmentType = 'Bonificacion total' | 'Promocion' | 'Importe manual'
export type PaymentAdjustmentMode = 'percentage' | 'fixed'

export type PaymentAdjustmentValue = {
    type: PaymentAdjustmentType
    mode: PaymentAdjustmentMode
    value: string
    reason: string
}

type AdjustmentTarget = Pick<Payment, 'student' | 'concept' | 'dueDate'> & { originalAmount: number }

type PaymentAdjustmentModalProps = {
    target: AdjustmentTarget | null
    value: PaymentAdjustmentValue
    adjustedAmount: number
    onChange: (value: PaymentAdjustmentValue) => void
    onClose: () => void
    onSubmit: () => void
}

export function PaymentAdjustmentModal({ target, value, adjustedAmount, onChange, onClose, onSubmit }: PaymentAdjustmentModalProps) {
    const update = (changes: Partial<PaymentAdjustmentValue>) => onChange({ ...value, ...changes })

    return (
        <EntityFormModal
            open={Boolean(target)}
            title="Ajustar pago"
            subtitle="Aplicá una bonificación, promoción o cambio de importe sobre esta cuota pendiente."
            submitLabel="Guardar ajuste"
            validate={() => validatePaymentAdjustment(value)}
            onClose={onClose}
            onSubmit={onSubmit}
        >
            <div className="form-stack">
                <FormSection title="Cuota seleccionada">
                    <FormGrid>
                        <FormField label="Alumno"><input className="form-input" type="text" value={target?.student ?? ''} readOnly /></FormField>
                        <FormField label="Concepto"><input className="form-input" type="text" value={target?.concept ?? ''} readOnly /></FormField>
                        <FormField label="Importe original"><input className="form-input" type="text" value={target ? `$${target.originalAmount.toLocaleString('es-AR')}` : ''} readOnly /></FormField>
                        <FormField label="Vencimiento"><input className="form-input" type="text" value={target ? getPaymentDisplayDate(target.dueDate) : ''} readOnly /></FormField>
                    </FormGrid>
                </FormSection>

                <FormSection title="Tipo de ajuste" description="El importe original se conserva y el ajuste impacta sólo en el monto final a cobrar.">
                    <FormGrid>
                        <FormField label="Acción">
                            <select className="form-input" value={value.type} onChange={(event) => update({ type: event.target.value as PaymentAdjustmentType })}>
                                <option value="Bonificacion total">Bonificar 100%</option>
                                <option value="Promocion">Aplicar promoción</option>
                                <option value="Importe manual">Definir importe manual</option>
                            </select>
                        </FormField>
                        {value.type === 'Promocion' && (
                            <FormField label="Tipo de promoción">
                                <select className="form-input" value={value.mode} onChange={(event) => update({ mode: event.target.value as PaymentAdjustmentMode })}>
                                    <option value="percentage">Porcentaje</option>
                                    <option value="fixed">Monto fijo</option>
                                </select>
                            </FormField>
                        )}
                        {value.type !== 'Bonificacion total' && (
                            <FormField label={value.type === 'Importe manual' ? 'Importe final' : value.mode === 'percentage' ? 'Descuento (%)' : 'Descuento ($)'}>
                                <input name="adjustmentValue" className="form-input" type="number" min="0" value={value.value} onChange={(event) => update({ value: event.target.value })} />
                            </FormField>
                        )}
                        <FormField label="Motivo">
                            <input name="adjustmentReason" className="form-input" type="text" value={value.reason} onChange={(event) => update({ reason: event.target.value })} placeholder="Ej: beca parcial, promo de inscripción, excepción comercial" />
                        </FormField>
                    </FormGrid>
                </FormSection>

                <FormSection title="Resultado">
                    <div style={{ display: 'grid', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <span style={{ color: 'var(--muted)' }}>Importe original</span>
                            <strong>{target ? `$${target.originalAmount.toLocaleString('es-AR')}` : '-'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <span style={{ color: 'var(--muted)' }}>Importe final</span>
                            <strong>{`$${adjustedAmount.toLocaleString('es-AR')}`}</strong>
                        </div>
                    </div>
                </FormSection>
            </div>
        </EntityFormModal>
    )
}
