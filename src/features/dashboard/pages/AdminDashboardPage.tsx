import { AlertTriangle, CalendarClock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ChartCard } from '@/components/layout/ChartCard'
import { KpiCard } from '@/components/layout/KpiCard'
import { getActiveAcademicCycleId, listAcademicCycles, listCourses, listPayments, listPrivateLessons, listStaff, listStudents, useAcademyRepositoryVersion } from '@/services/academyRepository'
import { getExpenseDisplayStatus, listExpenses, useFinanceRepositoryVersion } from '@/services/financeRepository'
import { useAgendaEvents } from '@/services/agendaRepository'
import { calculateOccupancy } from '@/domain/commissions/commissionRules'
import { formatAgendaDate } from '@/domain/agenda/agendaRules'
import { resolveChargeCollectionStatus, summarizeChargesToManage } from '@/domain/billing/paymentRules'
import { useAcademySettings } from '@/services/academySettingsRepository'
import { formatCurrencyARS, formatShortDate } from '@/domain/shared/formattingRules'
import { useBranchRoster, useBranches, useSelectedBranchId } from '@/services/branchRepository'
import { useWorkspace } from '@/workspace/useWorkspace'

const currency = { format: formatCurrencyARS }

export function AdminDashboardPage() {
    const { path } = useWorkspace()
    useAcademyRepositoryVersion()
    useFinanceRepositoryVersion()
    const selectedBranchId = useSelectedBranchId()
    const { branches } = useBranches()
    const selectedBranch = branches.find((branch) => branch.id === selectedBranchId)
    const { roster } = useBranchRoster(selectedBranchId || undefined)
    const { settings: academySettings } = useAcademySettings()
    const activeCycleId = getActiveAcademicCycleId()
    const activeCycle = listAcademicCycles().find((cycle) => cycle.id === activeCycleId)
    const today = new Date()
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    const currentMonthEndKey = `${currentMonthKey}-${String(new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()).padStart(2, '0')}`
    // With a cycle shown next to it the year is redundant; keep it only when there's no cycle to anchor the month.
    const currentMonthLabel = new Intl.DateTimeFormat('es-AR', activeCycle ? { month: 'long' } : { month: 'long', year: 'numeric' }).format(today)
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const reminderLimit = new Date(today)
    reminderLimit.setDate(reminderLimit.getDate() + 14)
    const reminderLimitKey = `${reminderLimit.getFullYear()}-${String(reminderLimit.getMonth() + 1).padStart(2, '0')}-${String(reminderLimit.getDate()).padStart(2, '0')}`
    const expenseReminders = listExpenses().filter((expense) => expense.branchId === selectedBranchId && expense.status !== 'Pagado' && expense.dueDate && expense.dueDate <= reminderLimitKey).slice(0, 4)
    const agendaUntil = new Date(today)
    agendaUntil.setDate(agendaUntil.getDate() + 90)
    const agendaUntilKey = `${agendaUntil.getFullYear()}-${String(agendaUntil.getMonth() + 1).padStart(2, '0')}-${String(agendaUntil.getDate()).padStart(2, '0')}`
    const { events: agendaEvents } = useAgendaEvents({ from: todayKey, to: agendaUntilKey }, { branchId: selectedBranchId, teacherUserIds: roster.teacherIds })
    const upcomingAgendaEvents = agendaEvents.filter((event) => event.type !== 'clase' && event.date >= todayKey).slice(0, 5)
    const upcomingPrivateClasses = agendaEvents.filter((event) => event.id.startsWith('PRIVATE-') && event.date >= todayKey).slice(0, 4)

    const data = (() => {
        const students = listStudents().filter((student) => student.branchId === selectedBranchId)
        const studentIdsInBranch = new Set(students.map((student) => student.id))
        const courses = listCourses().filter((course) => course.cycleId === activeCycleId && course.branchId === selectedBranchId)
        // Same status as Cobros: "Vencido" only after the grace days configured in Mi academia → Cobros.
        const graceDays = academySettings?.payments.graceDays ?? 0
        // Midnight, like Cobros: a charge due today is still Pendiente, not Vencido.
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const branchPayments = listPayments()
            .filter((payment) => payment.studentId !== undefined && studentIdsInBranch.has(payment.studentId))
            .map((payment) => ({ ...payment, status: resolveChargeCollectionStatus(payment.chargeSnapshot, startOfToday, graceDays) }))
        const payments = branchPayments.filter((payment) => (payment.status === 'Pagado' ? payment.date : payment.dueDate).startsWith(currentMonthKey))
        const commissions = courses.flatMap((course) => course.commissions.map((commission) => ({ ...commission, courseName: course.name })))
        const confirmedPayments = payments.filter((payment) => payment.status === 'Pagado')
        const chargesToManage = summarizeChargesToManage(branchPayments, currentMonthEndKey)
        // A registration is confirmed when its enrollment fee is paid, so the unpaid fees are the
        // registrations still waiting.
        const registrationFees = payments.filter((payment) => payment.status !== 'Anulado' && (payment.concept.startsWith('Matrícula') || payment.concept.startsWith('Inscripción')))
        const pendingPayments = [...chargesToManage.overdue, ...chargesToManage.pending]

        return {
            students,
            courses,
            activeStudents: students.filter((student) => student.status === 'Activo').length,
            pendingStudents: students.filter((student) => student.status === 'Pendiente').length,
            activeTeachers: listStaff().filter((teacher) => teacher.status === 'Activo' && teacher.userId !== undefined && roster.teacherIds.includes(teacher.userId)).length,
            commissions,
            confirmedPayments,
            pendingPayments,
            overdueCount: chargesToManage.overdue.length,
            pendingCount: chargesToManage.pending.length,
            receivedAmount: confirmedPayments.reduce((total, payment) => total + payment.amount, 0),
            pendingAmount: pendingPayments.reduce((total, payment) => total + payment.amount, 0),
            // A private lesson belongs to the branch of its student.
            activePrivateLessons: listPrivateLessons().filter((lesson) => lesson.status === 'Activa' && studentIdsInBranch.has(lesson.studentId)).length,
            registrations: registrationFees.length,
            unpaidRegistrations: registrationFees.filter((payment) => payment.status !== 'Pagado').length,
        }
    })()

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div>
                    <h1>Dashboard académico</h1>
                    <p>{selectedBranch && <>Sede <strong>{selectedBranch.name}</strong> · </>}{activeCycle ? <>Ciclo lectivo <strong>{activeCycle.name}</strong> · </> : 'Sin ciclo lectivo activo · '}Mes de <strong>{currentMonthLabel}</strong></p>
                </div>
            </div>

            <div className="kpi-grid">
                <KpiCard title="Alumnos activos" value={String(data.activeStudents)} change={`${data.pendingStudents} pendiente${data.pendingStudents === 1 ? '' : 's'} de activación`} positive={data.pendingStudents === 0} />
                <KpiCard title="Docentes activos" value={String(data.activeTeachers)} change={`Asignados a ${data.commissions.length} comisi${data.commissions.length === 1 ? 'ón' : 'ones'}`} />
                <KpiCard title="Cursos vigentes" value={String(data.courses.length)} change={`${data.commissions.length} comisi${data.commissions.length === 1 ? 'ón configurada' : 'ones configuradas'}`} />
                <KpiCard title="Inscripciones registradas" value={String(data.registrations)} change={data.unpaidRegistrations === 0 ? 'Todas con pago registrado' : `${data.unpaidRegistrations} esperando el pago para confirmarse`} positive={data.unpaidRegistrations === 0} />
            </div>

            <div className="content-grid">
                <ChartCard title="Alumnos por comisión" className="large-panel full-panel">
                    <div className="progress-list dashboard-progress-list">
                        {data.commissions.map((commission) => {
                            const enrolled = commission.studentsCount
                            const occupancy = calculateOccupancy(enrolled, commission.capacity)

                            return <div className="progress-row" key={commission.id}>
                                <div className="progress-label-row"><strong>{commission.courseName} · {commission.name}</strong><span>{enrolled} de {commission.capacity}</span></div>
                                <div className="progress-bar"><span style={{ width: `${occupancy}%` }} /></div>
                            </div>
                        })}
                    </div>
                </ChartCard>

                <ChartCard title="Comisiones activas" className="medium-panel">
                    <div className="dashboard-commission-list">
                        {data.commissions.map((commission) => <div key={commission.id}><strong>{commission.name}</strong><span>{commission.teachers.join(', ') || 'Sin profesores'} · {commission.schedule}</span></div>)}
                    </div>
                </ChartCard>

                {/* The branch's active private lessons and their next classes (from the agenda). */}
                <ChartCard title="Clases particulares" value={String(data.activePrivateLessons)} subtitle={`${data.activePrivateLessons === 1 ? 'Clase activa' : 'Clases activas'} en la sede`} action={<Link to={path('offers?tab=private')} className="card-header-action">Ver particulares</Link>} className="medium-panel">
                    <div className="dashboard-commission-list">
                        {upcomingPrivateClasses.map((event) => <div key={event.id}><strong>{event.title.replace('Particular · ', '')}</strong><span>{formatAgendaDate(event.date)}{event.startTime ? ` · ${event.startTime}` : ''}</span></div>)}
                        {upcomingPrivateClasses.length === 0 && <span>No hay clases particulares próximas.</span>}
                    </div>
                </ChartCard>

                <ChartCard title="Cobros confirmados" value={currency.format(data.receivedAmount)} subtitle={`${data.confirmedPayments.length} pago${data.confirmedPayments.length === 1 ? '' : 's'} registrado${data.confirmedPayments.length === 1 ? '' : 's'} este mes`} action={<Link to={path('billing?tab=recibidos')} className="card-header-action">Ver recibidos</Link>} className="dashboard-payment-card small-panel" />

                <ChartCard title="Cobros a gestionar" value={currency.format(data.pendingAmount)} subtitle={`${data.overdueCount} vencido${data.overdueCount === 1 ? '' : 's'} · ${data.pendingCount} pendiente${data.pendingCount === 1 ? '' : 's'} hasta fin de mes`} action={<Link to={path('billing?tab=pendientes')} className="card-header-action">Ver pendientes</Link>} className="dashboard-payment-card medium-panel" />

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
