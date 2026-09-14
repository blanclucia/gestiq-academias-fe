import { EntityFormModal, FormField } from '@/components/crud/EntityFormModal'
import type { Payment } from '@/types/domain'

type PaymentLinkTarget = Pick<Payment, 'student' | 'amount'>

type PaymentLinkModalProps = {
    target: PaymentLinkTarget | null
    link: string
    feedback: string
    onClose: () => void
    onCopy: () => void
}

export function PaymentLinkModal({ target, link, feedback, onClose, onCopy }: PaymentLinkModalProps) {
    return (
        <EntityFormModal
            open={Boolean(target)}
            title="Link de pago"
            subtitle={`Compartí este link con ${target?.student ?? 'el alumno'} para abonar ${target ? `$${target.amount.toLocaleString('es-AR')}` : ''}.`}
            submitLabel="Copiar link"
            onClose={onClose}
            onSubmit={onCopy}
        >
            <div className="form-stack">
                <FormField label="Link público de pago">
                    <input className="form-input" value={link} readOnly onFocus={(event) => event.currentTarget.select()} />
                </FormField>
                {feedback && <p style={{ margin: 0, color: 'var(--green)', fontSize: 13 }}>{feedback}</p>}
            </div>
        </EntityFormModal>
    )
}
