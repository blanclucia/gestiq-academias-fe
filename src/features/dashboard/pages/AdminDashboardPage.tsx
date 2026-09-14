import { AlertTriangle, CalendarClock, CreditCard } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ChartCard } from '@/components/layout/ChartCard'
import { KpiCard } from '@/components/layout/KpiCard'
import { getActiveAcademicCycleId, listAcademicCycles, listCourses, listPayments, listStaff, listStudents, listStudentsInCommission, useAcademyRepositoryVersion } from '@/services/academyRepository'
import { getExpenseDisplayStatus, listExpenses, useFinanceRepositoryVersion } from '@/services/financeRepository'
import { listUpcomingAgendaEvents, useAgendaRepositoryVersion } from '@/services/agendaRepository'
import { calculateOccupancy } from '@/domain/commissions/commissionRules'
import { formatCurrencyARS, formatShortDate } from '@/domain/shared/formattingRules'
import { useWorkspace } from '@/workspace/useWorkspace'

const currency = { format: formatCurrencyARS }

export function AdminDashboardPage() {
    const { path } = useWorkspace()
    useAcademyRepositoryVersion()
    useFinanceRepositoryVersion()
    useAgendaRepositoryVersion()
    const activeCycleId = getActiveAcademicCycleId()
    const activeCycle = listAcademicCycles().find((cycle) => cycle.id === activeCycleId)
    const today = new Date()
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    const currentMonthLabel = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(today)
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const reminderLimit = new Date(today)
    reminderLimit.setDate(reminderLimit.getDate() + 14)
    const reminderLimitKey = `${reminderLimit.getFullYear()}-${String(reminderLimit.getMonth() + 1).padStart(2, '0')}-${String(reminderLimit.getDate()).padStart(2, '0')}`
    const expenseReminders = listExpenses().filter((expense) => expense.status !== 'Pagado' && expense.dueDate && expense.dueDate <= reminderLimitKey).slice(0, 4)
    const upcomingAgendaEvents = listUpcomingAgendaEvents(todayKey, 5, ['clase'])

    const data = (() => {
        const students = listStudents()
        const courses = listCourses().filter((course) => course.cycleId === activeCycleId)
        const payments = listPayments().filter((payment) => {
            const referenceDate = payment.status === 'Pagado' ? payment.date : payment.dueDate
            return referenceDate.startsWith(currentMonthKey)
        })
        const commissions = courses.flatMap((course) => course.commissions.map((commission) => ({ ...commission, courseName: course.name })))
        const confirmedPayments = payments.filter((payment) => payment.status === 'Pagado')
        const pendingPayments = payments.filter((payment) => payment.status !== 'Pagado')

        return {
            students,
            courses,
            activeStudents: students.filter((student) => student.status === 'Activo').length,
            pendingStudents: students.filter((student) => student.status === 'Pendiente').length,
            activeTeachers: listStaff().filter((teacher) => teacher.status === 'Activo').length,
            commissions,
            confirmedPayments,
            pendingPayments,
            receivedAmount: confirmedPayments.reduce((total, payment) => total + payment.amount, 0),
            pendingAmount: pendingPayments.reduce((total, payment) => total + payment.amount, 0),
            registrations: payments.filter((payment) => payment.concept.startsWith('Matrícula') || payment.concept.startsWith('Inscripción')).length,
        }
    })()

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div>
                    <h1>Dashboard académico</h1>
                    <p>Este mes: <strong>{currentMonthLabel}</strong> · {activeCycle?.name ?? 'ciclo seleccionado'}</p>
                </div>
            </div>

            <div className="kpi-grid">
                <KpiCard title="Alumnos activos" value={String(data.activeStudents)} change={`${data.pendingStudents} pendientes de activación`} positive={false} />
                <KpiCard title="Docentes activos" value={String(data.activeTeachers)} change={`Asignados a ${data.commissions.length} comisiones`} />
                <KpiCard title="Curso vigente" value={String(data.courses.length)} change={`${data.commissions.length} comisiones configuradas`} />
                <KpiCard title="Inscripciones registradas" value={String(data.registrations)} change="Con pago pendiente de confirmar" positive={false} />
            </div>

            <div className="content-grid">
                <ChartCard title="Alumnos por comisión" subtitle="Asignaciones actuales" className="large-panel">
                    <div className="progress-list dashboard-progress-list">
                        {data.commissions.map((commission) => {
                            const enrolled = listStudentsInCommission(commission.courseName, commission.name, commission.id).length
                            const occupancy = calculateOccupancy(enrolled, commission.capacity)

                            return <div className="progress-row" key={commission.id}>
                                <div className="progress-label-row"><strong>{commission.courseName} · {commission.name}</strong><span>{enrolled} de {commission.capacity}</span></div>
                                <div className="progress-bar"><span style={{ width: `${occupancy}%` }} /></div>
                            </div>
                        })}
                    </div>
                </ChartCard>

                <ChartCard title="Comisiones activas" subtitle="Oferta académica actual" className="medium-panel">
                    <div className="dashboard-commission-list">
                        {data.commissions.map((commission) => <div key={commission.id}><strong>{commission.name}</strong><span>{commission.teachers.join(', ') || 'Sin profesores'} · {commission.schedule}</span></div>)}
                    </div>
                </ChartCard>

                <ChartCard title="Cobros confirmados" value={currency.format(data.receivedAmount)} subtitle={`${data.confirmedPayments.length} pagos registrados`} className="dashboard-payment-card small-panel">
                    <div className="dashboard-summary-icon positive"><CreditCard size={22} /></div>
                </ChartCard>

                <ChartCard title="Cobros a gestionar" value={currency.format(data.pendingAmount)} subtitle={`${data.pendingPayments.length} pagos pendientes o rechazados`} className="dashboard-payment-card medium-panel">
                    <div className="dashboard-summary-icon warning"><CreditCard size={22} /></div>
                </ChartCard>

                <ChartCard title="Recordatorios financieros" subtitle="Próximos vencimientos de egresos" action={<Link to={path('finances?tab=expenses')} className="card-header-action">Ver finanzas</Link>} className="large-panel">
                    <div className="dashboard-finance-reminders">
                        {expenseReminders.map((expense) => {
                            const status = getExpenseDisplayStatus(expense, todayKey)
                            const dueDate = expense.dueDate ?? ''
                            return <Link to={path('finances?tab=expenses')} key={expense.id}><span className={status === 'Vencido' ? 'danger' : 'warning'}>{status === 'Vencido' ? <AlertTriangle size={17} /> : <CalendarClock size={17} />}</span><span><strong>{expense.concept}</strong><small>{status === 'Vencido' ? 'Vencido' : 'Próximo'} · {formatShortDate(dueDate)}</small></span><b>{currency.format(expense.amount)}</b></Link>
                        })}
                        {expenseReminders.length === 0 && <p>No hay egresos próximos a vencer.</p>}
                    </div>
                </ChartCard>

                <ChartCard title="Próximos eventos" subtitle="Feriados, cumpleaños y actividades" action={<Link to={path('schedule')} className="card-header-action">Ver agenda</Link>} className="large-panel">
                    <div className="dashboard-agenda-reminders">
                        {upcomingAgendaEvents.map((event) => <Link to={path('schedule')} key={event.id}><span className={`agenda-upcoming-icon ${event.type === 'feriado' ? 'holiday' : event.type === 'cumpleanos' ? 'birthday' : ''}`}><CalendarClock size={16} /></span><span><strong>{event.title}</strong><small>{event.date.split('-').reverse().join('/')}{event.location ? ` · ${event.location}` : ''}</small></span></Link>)}
                        {upcomingAgendaEvents.length === 0 && <p>No hay eventos próximos.</p>}
                    </div>
                </ChartCard>
            </div>
        </div>
    )
}
