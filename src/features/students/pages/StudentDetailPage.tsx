import { Activity, ArrowLeft, Cake, GraduationCap, PauseCircle, PlayCircle, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { DeleteConfirmationModal } from '@/components/crud/EntityFormModal'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { MetricTile, MetricTileGrid } from '@/components/ui/MetricTile'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/ToastContext'
import { formatCurrencyARS, formatShortDate } from '@/domain/shared/formattingRules'
import { calculateAge } from '@/domain/students/studentRules'
import { listPayments, listStudents, useAcademyRepositoryVersion, useCharges, useStudentEnrollments, useUpdateStudent } from '@/services/academyRepository'
import { isStudentDocumentConflict } from '@/services/organization/studentsApi'
import { useWorkspace } from '@/workspace/useWorkspace'
import { StudentSettingsCards } from '../components/StudentSettingsCards'
import { toStudentDetailValue } from '../model/studentDetailValue'

type StudentTab = 'overview' | 'courses'

const statusToneMap = {
    Activo: 'success',
    Pendiente: 'warning',
    Inactivo: 'neutral',
} as const

export function StudentDetailPage() {
    useAcademyRepositoryVersion()
    useCharges()
    const navigate = useNavigate()
    const { path } = useWorkspace()
    const { showToast } = useToast()
    const { studentId } = useParams()
    // The active tab lives in the URL (?tab=courses), like the offer, commission and enrollment details.
    const [searchParams, setSearchParams] = useSearchParams()
    const activeTab: StudentTab = searchParams.get('tab') === 'courses' ? 'courses' : 'overview'
    const setActiveTab = (tab: StudentTab) => setSearchParams(tab === 'overview' ? {} : { tab }, { replace: true })
    const [isStatusChangeOpen, setIsStatusChangeOpen] = useState(false)
    const updateStudent = useUpdateStudent()

    const student = listStudents().find((item) => item.id === studentId)
    const { history: commissionHistory } = useStudentEnrollments(student?.id)

    if (!student) {
        return (
            <div className="dashboard-page">
                <div className="page-header"><div><h1>Alumno no encontrado</h1></div></div>
                <div className="data-table-card">
                    <p>El alumno solicitado no existe o fue eliminado.</p>
                    <Link to={path('students')} className="primary-button detail-back-button">Volver a alumnos</Link>
                </div>
            </div>
        )
    }

    const activeCoursesCount = commissionHistory.filter((entry) => entry.status === 'Activo').length
    const age = student.birthDate ? calculateAge(student.birthDate) : null
    // What the student still owes: their unpaid, not voided charges (same set Cobros manages).
    const pendingBalance = listPayments()
        .filter((payment) => payment.studentId === student.id && payment.status !== 'Pagado' && payment.status !== 'Anulado')
        .reduce((total, payment) => total + payment.amount, 0)
    // Pausing or reactivating is an action on the whole student, so it lives in the header with a
    // confirmation instead of being an editable Estado field.
    const nextStatus = student.status === 'Activo' ? 'Inactivo' : 'Activo'
    const statusAction = student.status === 'Activo'
        ? { label: 'Pausar alumno', icon: <PauseCircle size={15} />, description: `${student.fullName} pasará a estado Inactivo. Sigue en sus comisiones y conserva sus cobros; podés reactivarlo cuando quieras.`, done: 'Alumno pausado correctamente.' }
        : { label: student.status === 'Pendiente' ? 'Activar alumno' : 'Reactivar alumno', icon: <PlayCircle size={15} />, description: `${student.fullName} pasará a estado Activo.`, done: student.status === 'Pendiente' ? 'Alumno activado correctamente.' : 'Alumno reactivado correctamente.' }

    return (
        <div className="dashboard-page">
            <DeleteConfirmationModal
                open={isStatusChangeOpen}
                title={statusAction.label}
                description={statusAction.description}
                confirmLabel={statusAction.label}
                onClose={() => setIsStatusChangeOpen(false)}
                onConfirm={async () => {
                    await updateStudent.mutateAsync({ id: student.id, changes: { status: nextStatus } })
                    showToast('success', statusAction.done)
                    setIsStatusChangeOpen(false)
                }}
            />

            <div className="page-header compact">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', color: 'var(--muted)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        <Link to={path('students')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted)', textDecoration: 'none' }}>
                            <ArrowLeft size={14} />
                            Alumnos
                        </Link>
                        <span>›</span>
                        <span>DNI {student.document}</span>
                    </div>
                    <h1 style={{ marginTop: 16 }}>{student.fullName}</h1>
                </div>
                <div className="page-header-actions">
                    <button type="button" className="secondary-button compact-button" onClick={() => setIsStatusChangeOpen(true)}>{statusAction.icon}{statusAction.label}</button>
                </div>
            </div>

            <div className="academy-tabs-wrap">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as StudentTab)}>
                    <TabsList variant="line" aria-label="Detalle de alumno">
                        <TabsTrigger value="overview">Resumen</TabsTrigger>
                        <TabsTrigger value="courses">Cursos y comisiones</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="offer-detail-stack">
                    {activeTab === 'overview' && (
                        <MetricTileGrid>
                            <MetricTile icon={<GraduationCap size={20} />} label="Cursos activos" value={activeCoursesCount} />
                            <MetricTile icon={<Cake size={20} />} label="Edad" value={age === null ? 'Sin dato' : `${age} año${age === 1 ? '' : 's'}`} />
                            <MetricTile icon={<Wallet size={20} />} label="Saldo pendiente" value={formatCurrencyARS(pendingBalance)} />
                            <MetricTile icon={<Activity size={20} />} label="Estado" value={<StatusBadge label={student.status} tone={statusToneMap[student.status]} />} />
                        </MetricTileGrid>
                    )}

                    {activeTab === 'overview' && (
                        <StudentSettingsCards
                            // Remount on every saved change (own save, pausing) so the draft restarts from it.
                            key={`${student.id}:${JSON.stringify(toStudentDetailValue(student))}`}
                            student={student}
                            saving={updateStudent.isPending}
                            onSave={async (changes) => {
                                try {
                                    await updateStudent.mutateAsync({ id: student.id, changes })
                                    showToast('success', 'Alumno actualizado correctamente.')
                                    return null
                                } catch (error) {
                                    return isStudentDocumentConflict(error) ? 'Ya existe un alumno con ese DNI en esta organización.' : 'No se pudieron guardar los cambios. Intentá nuevamente.'
                                }
                            }}
                        />
                    )}

                    {activeTab === 'courses' && (
                        <Card>
                            <SectionHeading icon={<GraduationCap size={20} />} title="Cursos y comisiones" description={`${commissionHistory.length} comisi${commissionHistory.length === 1 ? 'ón registrada' : 'ones registradas'}`} />
                            <DataTable
                                rows={commissionHistory}
                                getRowKey={(entry) => `${entry.courseName}-${entry.commissionName}`}
                                onRowClick={(entry) => { if (entry.courseId) navigate(path(`oferta/${entry.courseId}/comisiones/${entry.commissionId}`)) }}
                                emptyLabel="Este alumno todavía no tiene comisiones registradas."
                                columns={[
                                    { key: 'course', header: 'Curso', accessor: (entry) => entry.courseName },
                                    { key: 'commission', header: 'Comisión', accessor: (entry) => entry.commissionName },
                                    { key: 'period', header: 'Cursada', accessor: (entry) => `${formatShortDate(entry.startDate, '-')} al ${formatShortDate(entry.endDate, '-')}` },
                                    { key: 'enrolledAt', header: 'Alta', accessor: (entry) => formatShortDate(entry.enrolledAt.slice(0, 10), '-') },
                                    { key: 'status', header: 'Estado', accessor: (entry) => <StatusBadge label={entry.status} tone={entry.status === 'Activo' ? 'success' : entry.status === 'Pausado' ? 'warning' : entry.status === 'Baja' ? 'danger' : 'neutral'} />, align: 'center' },
                                ]}
                            />
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
