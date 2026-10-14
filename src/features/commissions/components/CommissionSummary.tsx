import { ClipboardList, PencilLine } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { AcademicCommission } from '@/services/academyRepository'

type CommissionSummaryProps = {
    courseName: string
    commission: AcademicCommission
    onEdit: () => void
    onCloseCommission: () => void
}

export function CommissionSummary({ courseName, commission, onEdit, onCloseCommission }: CommissionSummaryProps) {
    const statusTone = commission.status === 'Activa' ? 'success' : commission.status === 'Programada' ? 'warning' : 'neutral'

    return (
        <Card className="offer-summary-card">
            <section className="offer-overview-hero">
                <SectionHeading icon={<ClipboardList size={20} />} title="Información general" description="Datos generales de esta comisión." />
                <div className="offer-overview-actions">
                    <button type="button" className="secondary-button compact-button" onClick={onEdit}><PencilLine size={15} /> Editar comisión</button>
                    {commission.status !== 'Cerrada' && <button type="button" className="secondary-button compact-button" onClick={onCloseCommission}>Cerrar comisión</button>}
                </div>
            </section>
            <dl className="offer-detail-list commission-detail-list">
                <div><dt>Estado</dt><dd><StatusBadge label={commission.status} tone={statusTone} /></dd></div><div><dt>Oferta académica</dt><dd>{courseName}</dd></div><div><dt>Docentes</dt><dd>{commission.teachers.join(', ') || 'Sin asignar'}</dd></div><div><dt>Horario</dt><dd>{commission.schedule}</dd></div><div><dt>Período</dt><dd>{commission.startDate} al {commission.endDate}</dd></div><div><dt>Valor mensual</dt><dd>${commission.amount.toLocaleString('es-AR')}</dd></div><div><dt>Vencimiento mensual</dt><dd>Día {commission.dueDay}</dd></div>
            </dl>
        </Card>
    )
}
