import { CalendarDays, ClipboardCheck, Clock3, Users } from 'lucide-react'
import { ChartCard } from '@/components/layout/ChartCard'
import { KpiCard } from '@/components/layout/KpiCard'

export function TeacherDashboardPage() {
    return <div className="dashboard-page">
        <div className="page-header"><div><h1>Hola, Lucía</h1><p>Tu jornada docente en Sede San José.</p></div></div>
        <div className="kpi-grid">
            <KpiCard title="Clases de hoy" value="3" change="La próxima comienza a las 16:00" />
            <KpiCard title="Alumnos hoy" value="24" change="En 3 comisiones" />
            <KpiCard title="Asistencias pendientes" value="1" change="Inglés General · Grupo B" positive={false} />
            <KpiCard title="Horas esta semana" value="12 h" change="4 horas restantes" />
        </div>
        <div className="content-grid">
            <ChartCard title="Próximas clases" subtitle="Agenda de hoy" className="large-panel"><div className="role-dashboard-list"><div><Clock3 size={18} /><span><strong>Inglés General · Grupo A</strong><small>16:00–17:30 · Aula 2</small></span></div><div><Clock3 size={18} /><span><strong>Conversación · Intermedio</strong><small>18:00–19:00 · Aula 4</small></span></div><div><Clock3 size={18} /><span><strong>Inglés General · Grupo B</strong><small>19:30–21:00 · Aula 2</small></span></div></div></ChartCard>
            <ChartCard title="Acciones pendientes" subtitle="Antes de terminar el día"><div className="role-dashboard-list compact"><div><ClipboardCheck size={18} /><span><strong>Completar asistencia</strong><small>Grupo B · clase anterior</small></span></div><div><Users size={18} /><span><strong>Revisar incorporación</strong><small>2 alumnos nuevos</small></span></div><div><CalendarDays size={18} /><span><strong>Próxima evaluación</strong><small>Viernes 11 de septiembre</small></span></div></div></ChartCard>
        </div>
    </div>
}
