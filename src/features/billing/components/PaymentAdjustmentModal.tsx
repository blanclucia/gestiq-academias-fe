import { EntityFormModal, FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import type { Payment } from '@/types/domain'
import { validatePaymentAdjustment } from '../model/billingValidation'

export type PaymentAdjustmentType = 'Sin cambio' | 'Bonificacion total' | 'Promocion' | 'Recargo por mora' | 'Importe manual'
export type PaymentAdjustmentMode = 'percentage' | 'fixed'

export type PaymentAdjustmentValue = {
    type: PaymentAdjustmentType
    mode: PaymentAdjustmentMode
    value: string
    reason: string
    // Due date of the charge; changing it alone (keeping the amount) is a valid adjustment.
    dueDate: string
}

type AdjustmentTarget = Pick<Payment, 'student' | 'concept' | 'dueDate'> & { originalAmount: number }

type PaymentAdjustmentModalProps = {
    target: AdjustmentTarget | null
    value: PaymentAdjustmentValue
    adjustedAmount: number
    lateFeePercent: number
    onChange: (value: PaymentAdjustmentValue) => void
    onClose: () => void
    onSubmit: () => void | Promise<unknown>
}

export function PaymentAdjustmentModal({ target, value, adjustedAmount, lateFeePercent, onChange, onClose, onSubmit }: PaymentAdjustmentModalProps) {
    const update = (changes: Partial<PaymentAdjustmentValue>) => onChange({ ...value, ...changes })

    return (
        <EntityFormModal
            open={Boolean(target)}
            title="Ajustar cobro"
            subtitle="Cambiá el vencimiento o aplicá una bonificación, promoción o recargo sobre este cobro pendiente."
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
                        <FormField label="Vencimiento" required><input name="adjustmentDueDate" className="form-input" type="date" value={value.dueDate} onChange={(event) => update({ dueDate: event.target.value })} /></FormField>
                    </FormGrid>
                </FormSection>

                <FormSection title="Ajuste de importe" description="Opcional. El importe original se conserva y el ajuste impacta sólo en el monto final a cobrar.">
                    <FormGrid>
                        <FormField label="Acción">
                            <SearchableSelect
                                value={value.type}
                                onChange={(typeValue) => {
                                    const type = typeValue as PaymentAdjustmentType
                                    update({ type, value: type === 'Recargo por mora' && !value.value ? String(lateFeePercent) : value.value })
                                }}
                                options={[
                                    { value: 'Sin cambio', label: 'Sin cambio de importe' },
                                    { value: 'Bonificacion total', label: 'Bonificar 100%' },
                                    { value: 'Promocion', label: 'Aplicar promoción' },
                                    { value: 'Recargo por mora', label: 'Aplicar recargo por mora' },
                                    { value: 'Importe manual', label: 'Definir importe manual' },
                                ]}
                            />
                        </FormField>
                        {value.type === 'Promocion' && (
                            <FormField label="Tipo de promoción">
                                <SearchableSelect value={value.mode} onChange={(mode) => update({ mode: mode as PaymentAdjustmentMode })} options={[{ value: 'percentage', label: 'Porcentaje' }, { value: 'fixed', label: 'Monto fijo' }]} />
                            </FormField>
                        )}
                        {value.type !== 'Bonificacion total' && value.type !== 'Sin cambio' && (
                            <FormField
                                label={
                                    value.type === 'Importe manual' ? 'Importe final'
                                        : value.type === 'Recargo por mora' ? `Recargo (%) · sugerido ${lateFeePercent}%`
                                            : value.mode === 'percentage' ? 'Descuento (%)' : 'Descuento ($)'
                                }
                            >
                                <input name="adjustmentValue" className="form-input" type="number" min="0" value={value.value} onChange={(event) => update({ value: event.target.value })} />
                            </FormField>
                        )}
                        <FormField label="Motivo" required={value.type !== 'Sin cambio'}>
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
