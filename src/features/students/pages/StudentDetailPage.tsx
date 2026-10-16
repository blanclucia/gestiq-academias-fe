import { Activity, ArrowLeft, BookOpen, Cake, GraduationCap, PauseCircle, PlayCircle, SlidersHorizontal, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { DeleteConfirmationModal, EntityFormModal, FormField } from '@/components/crud/EntityFormModal'
import { RowActionMenu } from '@/components/ui/RowActionMenu'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { MetricTile, MetricTileGrid } from '@/components/ui/MetricTile'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/ToastContext'
import { formatCurrencyARS, formatShortDate } from '@/domain/shared/formattingRules'
import { calculateAge } from '@/domain/students/studentRules'
import { listPayments, listStudents, useAcademyRepositoryVersion, useAssignEnrollment, useCharges, useGenerateTuition, useStudentEnrollments, useUpdateStudent, type CommissionStudentStatus, type StudentEnrollmentHistoryRow } from '@/services/academyRepository'
import { describeEnrollmentFailure } from '@/services/organization/academicOffersApi'
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
    const assignEnrollment = useAssignEnrollment()
    const generateTuition = useGenerateTuition()
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [enrollmentTarget, setEnrollmentTarget] = useState<StudentEnrollmentHistoryRow | null>(null)
    const [enrollmentStatus, setEnrollmentStatus] = useState<CommissionStudentStatus>('Activo')
    const [enrollmentError, setEnrollmentError] = useState('')

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

    // Same flow as Comisión → Alumnos → Cambiar estado: reactivating generates the missing cuotas.
    const saveEnrollmentStatus = async () => {
        if (!enrollmentTarget) return
        try {
            await assignEnrollment.mutateAsync({ courseId: enrollmentTarget.courseId, commissionId: enrollmentTarget.commissionId, studentId: student.id, status: enrollmentStatus })
            if (enrollmentStatus === 'Activo') await generateTuition.mutateAsync({ studentId: student.id, commissionId: enrollmentTarget.commissionId })
        } catch (error) {
            setEnrollmentError(describeEnrollmentFailure(error) ?? 'No se pudo actualizar el estado. Intentá nuevamente.')
            throw error
        }
        showToast('success', enrollmentStatus === 'Baja' ? `${student.fullName} quedó dado de baja de ${enrollmentTarget.commissionName}.` : 'Estado en la comisión actualizado.')
        setEnrollmentTarget(null)
    }

    return (
        <div className="dashboard-page">
            <EntityFormModal
                open={Boolean(enrollmentTarget)}
                title="Estado en la comisión"
                subtitle={enrollmentTarget ? `${enrollmentTarget.courseName} · ${enrollmentTarget.commissionName}` : undefined}
                submitLabel="Guardar estado"
                submitErrorMessage={enrollmentError || undefined}
                onClose={() => setEnrollmentTarget(null)}
                onSubmit={saveEnrollmentStatus}
            >
                <FormField label="Estado" hint={enrollmentStatus === 'Baja' || enrollmentStatus === 'Finalizado' ? 'Las cuotas pendientes de esta comisión siguen en Cobros: anulá las que ya no correspondan.' : undefined}>
                    <SearchableSelect
                        value={enrollmentStatus}
                        onChange={(status) => { setEnrollmentStatus(status as CommissionStudentStatus); setEnrollmentError('') }}
                        options={[
                            { value: 'Activo', label: 'Activo' },
                            { value: 'Pausado', label: 'Pausado' },
                            { value: 'Finalizado', label: 'Finalizado' },
                            { value: 'Baja', label: 'Baja' },
                        ]}
                    />
                </FormField>
            </EntityFormModal>

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
                                renderActions={(entry) => <RowActionMenu ariaLabel={`Acciones para ${entry.commissionName}`} active={openMenuId === entry.id} onToggle={() => setOpenMenuId((current) => current === entry.id ? null : entry.id)} actions={[
                                    { label: 'Ver comisión', icon: <BookOpen size={15} />, onClick: () => navigate(path(`oferta/${entry.courseId}/comisiones/${entry.commissionId}`)) },
                                    { label: 'Cambiar estado', icon: <SlidersHorizontal size={15} />, onClick: () => { setEnrollmentStatus(entry.status); setEnrollmentError(''); setEnrollmentTarget(entry); setOpenMenuId(null) } },
                                ]} />}
                            />
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
