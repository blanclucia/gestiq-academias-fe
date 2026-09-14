import { CalendarDays, Users } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { AcademicCommission } from '@/services/academyRepository'

export function CommissionSummary({ courseName, commission, studentCount }: { courseName: string; commission: AcademicCommission; studentCount: number }) {
    const statusTone = commission.status === 'Activa' ? 'success' : commission.status === 'Programada' ? 'warning' : 'neutral'
    const cards = [
        { label: 'Alumnos', value: studentCount, icon: <Users size={14} /> },
        { label: 'Cupos', value: `${studentCount}/${commission.capacity}`, icon: <CalendarDays size={14} /> },
        { label: 'Profesores', value: commission.teachers.join(', ') || 'Sin asignar' },
    ]

    return <div style={{ marginTop: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
            {cards.map((card) => <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 14, background: 'rgba(148, 163, 184, 0.04)' }} key={card.label}><div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{card.icon}{card.label}</div><div style={{ fontSize: card.label === 'Profesores' ? 18 : 28, fontWeight: card.label === 'Profesores' ? 700 : 800, marginTop: 8 }}>{card.value}</div></div>)}
            <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 14, background: 'rgba(148, 163, 184, 0.04)' }}><div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Estado</div><div style={{ marginTop: 8 }}><StatusBadge label={commission.status} tone={statusTone} /></div></div>
        </div>
        <section style={{ marginTop: 20, padding: 18, border: '1px solid var(--border)', borderRadius: 14 }}>
            <div className="offer-panel-heading"><div><h3>Configuración de la comisión</h3><p>Condiciones académicas y financieras de esta cursada.</p></div></div>
            <dl className="offer-detail-list commission-detail-list">
                <div><dt>Oferta académica</dt><dd>{courseName}</dd></div><div><dt>Docentes</dt><dd>{commission.teachers.join(', ') || 'Sin asignar'}</dd></div><div><dt>Horario</dt><dd>{commission.schedule}</dd></div><div><dt>Período</dt><dd>{commission.startDate} al {commission.endDate}</dd></div><div><dt>Valor mensual</dt><dd>${commission.amount.toLocaleString('es-AR')}</dd></div><div><dt>Vencimiento mensual</dt><dd>Día {commission.dueDay}</dd></div>
            </dl>
        </section>
    </div>
}
