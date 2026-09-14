import { BookOpen, CalendarDays, CheckCircle2, CreditCard } from 'lucide-react'
import { ChartCard } from '@/components/layout/ChartCard'
import { KpiCard } from '@/components/layout/KpiCard'

export function StudentDashboardPage() {
    return <div className="dashboard-page">
        <div className="page-header"><div><h1>Hola, Lucía</h1><p>Este es el resumen de tu actividad académica.</p></div></div>
        <div className="kpi-grid">
            <KpiCard title="Próxima clase" value="Hoy 18:00" change="Inglés General · Aula 2" />
            <KpiCard title="Asistencia" value="92%" change="11 de 12 clases" />
            <KpiCard title="Cursos activos" value="2" change="Ciclo lectivo 2026" />
            <KpiCard title="Próximo vencimiento" value="$48.000" change="Vence el 10 de septiembre" positive={false} />
        </div>
        <div className="content-grid">
            <ChartCard title="Mis próximos encuentros" subtitle="Agenda académica" className="large-panel"><div className="role-dashboard-list"><div><CalendarDays size={18} /><span><strong>Inglés General · Grupo A</strong><small>Hoy · 18:00–19:30</small></span></div><div><CalendarDays size={18} /><span><strong>Taller de conversación</strong><small>Miércoles · 19:00–20:00</small></span></div></div></ChartCard>
            <ChartCard title="Estado general" subtitle="Tu actividad"><div className="role-dashboard-list compact"><div><CheckCircle2 size={18} /><span><strong>Inscripción confirmada</strong><small>Inglés General 2026</small></span></div><div><BookOpen size={18} /><span><strong>Material disponible</strong><small>Unidad 6 · Present perfect</small></span></div><div><CreditCard size={18} /><span><strong>Cuota de septiembre</strong><small>Pendiente de pago</small></span></div></div></ChartCard>
        </div>
    </div>
}
