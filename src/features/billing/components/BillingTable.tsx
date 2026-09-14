import { BellRing, CreditCard, Link2, PencilLine, Trash2 } from 'lucide-react'
import { DataTable } from '@/components/ui/DataTable'
import { RowActionMenu } from '@/components/ui/RowActionMenu'
import { StatusBadge, type StatusBadgeTone } from '@/components/ui/StatusBadge'
import { getPaymentDisplayDate, getPaymentReminderLabel, resolveChargeCollectionStatus } from '@/domain/billing/paymentRules'
import type { ChargePaymentSnapshot, Payment } from '@/types/domain'
import type { PaymentAdjustmentMode, PaymentAdjustmentType } from './PaymentAdjustmentModal'

export type BillingPaymentRecord = Payment & {
    originalAmount: number
    chargeSnapshot: ChargePaymentSnapshot
    adjustment?: {
        type: PaymentAdjustmentType
        mode?: PaymentAdjustmentMode
        value?: number
        reason: string
    }
}

type BillingTableProps = {
    rows: BillingPaymentRecord[]
    today: Date
    currentPage: number
    totalPages: number
    selectedIds: string[]
    selectAllChecked: boolean
    openMenuId: string | null
    canAdjust: boolean
    onPageChange: (page: number) => void
    onToggleSelection: (id: string) => void
    onToggleSelectAll: () => void
    onToggleMenu: (id: string) => void
    onEdit: (payment: BillingPaymentRecord) => void
    onPaymentLink: (payment: BillingPaymentRecord) => void
    onCollect: (payment: BillingPaymentRecord) => void
    onAdjust: (payment: BillingPaymentRecord) => void
    onRemind: (payment: BillingPaymentRecord) => void
    onDelete: (payment: BillingPaymentRecord) => void
}

const statusToneMap: Record<Payment['status'], StatusBadgeTone> = {
    Pagado: 'success',
    Pendiente: 'neutral',
    'En verificación': 'warning',
    Rechazado: 'neutral',
    Vencido: 'warning',
    Parcial: 'warning',
    Anulado: 'neutral',
}

function getAdjustmentBadge(payment: BillingPaymentRecord): { label: string; tone: StatusBadgeTone } | null {
    if (!payment.adjustment) return null
    if (payment.adjustment.type === 'Bonificacion total') return { label: 'Bonificado', tone: 'success' }
    if (payment.adjustment.type === 'Promocion') return { label: 'Promo aplicada', tone: 'warning' }
    return { label: 'Importe editado', tone: 'neutral' }
}

export function BillingTable(props: BillingTableProps) {
    return (
        <DataTable
            rows={props.rows}
            getRowKey={(payment) => payment.id}
            pagination={{ currentPage: props.currentPage, totalPages: props.totalPages, onPageChange: props.onPageChange }}
            columns={[
                {
                    key: 'select',
                    header: <input type="checkbox" checked={props.selectAllChecked} onChange={props.onToggleSelectAll} aria-label="Seleccionar todos" />,
                    accessor: (payment) => <input type="checkbox" checked={props.selectedIds.includes(payment.id)} onChange={() => props.onToggleSelection(payment.id)} aria-label={`Seleccionar ${payment.student}`} />,
                    align: 'center',
                },
                {
                    key: 'student', header: 'Alumno', accessor: (payment) => {
                        const badge = getAdjustmentBadge(payment)
                        return <div className="student-cell"><div className="student-avatar">{payment.student.charAt(0)}</div><div style={{ display: 'grid', gap: 4 }}><strong>{payment.student}</strong>{badge ? <div style={{ display: 'grid', gap: 4, justifyItems: 'start' }}><span style={{ transform: 'scale(0.92)', transformOrigin: 'left center' }}><StatusBadge label={badge.label} tone={badge.tone} /></span></div> : null}</div></div>
                    },
                },
                { key: 'concept', header: 'Concepto', accessor: (payment) => <span>{payment.concept}</span> },
                { key: 'method', header: 'Método', accessor: (payment) => <span>{payment.method}</span> },
                { key: 'date', header: 'Vencimiento', accessor: (payment) => <strong>{getPaymentDisplayDate(payment.dueDate)}</strong> },
                { key: 'paymentDate', header: 'Fecha pago', accessor: (payment) => <span>{getPaymentDisplayDate(payment.date)}</span> },
                {
                    key: 'amount', header: 'Monto', align: 'right', accessor: (payment) => <div style={{ display: 'grid', gap: 2, justifyItems: 'end' }}><strong>{`$${payment.amount.toLocaleString('es-AR')}`}</strong>{payment.adjustment && payment.originalAmount !== payment.amount ? <span style={{ color: 'var(--muted)', fontSize: 12 }}>Original $ {payment.originalAmount.toLocaleString('es-AR')} · {payment.adjustment.type}</span> : null}</div>,
                },
                {
                    key: 'reminder', header: 'Recordatorio', accessor: (payment) => <span>{getPaymentReminderLabel(payment, resolveChargeCollectionStatus(payment.chargeSnapshot, props.today), props.today)}{payment.lastReminderAt ? ` · Último ${getPaymentDisplayDate(payment.lastReminderAt)}` : ''}</span>,
                },
                {
                    key: 'status', header: 'Estado', align: 'center', accessor: (payment) => { const status = resolveChargeCollectionStatus(payment.chargeSnapshot, props.today); return <StatusBadge label={status} tone={statusToneMap[status]} /> },
                },
            ]}
            renderActions={(payment) => {
                const status = resolveChargeCollectionStatus(payment.chargeSnapshot, props.today)
                const collectable = ['Pendiente', 'En verificación', 'Vencido', 'Rechazado'].includes(status)
                return <RowActionMenu ariaLabel={`Acciones para ${payment.student}`} active={props.openMenuId === payment.id} onToggle={() => props.onToggleMenu(payment.id)} actions={[
                    { label: 'Editar', icon: <PencilLine size={15} />, onClick: () => props.onEdit(payment) },
                    ...(collectable ? [
                        { label: 'Generar link de pago', icon: <Link2 size={15} />, onClick: () => props.onPaymentLink(payment) },
                        { label: status === 'En verificación' ? 'Confirmar transferencia' : 'Registrar cobro', icon: <CreditCard size={15} />, onClick: () => props.onCollect(payment) },
                    ] : []),
                    ...(props.canAdjust ? [{ label: 'Ajustar pago', icon: <PencilLine size={15} />, onClick: () => props.onAdjust(payment) }] : []),
                    ...(status === 'Pendiente' || status === 'Vencido' ? [{ label: status === 'Vencido' ? 'Recordar vencido' : 'Recordar próximo vencimiento', icon: <BellRing size={15} />, onClick: () => props.onRemind(payment) }] : []),
                    { label: 'Eliminar', icon: <Trash2 size={15} />, onClick: () => props.onDelete(payment), variant: 'danger' },
                ]} />
            }}
            emptyLabel="No se encontraron pagos con esos filtros."
        />
    )
}
