import { ArrowLeft, CalendarDays, GraduationCap, Mail, Phone } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable } from '@/components/ui/DataTable'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { listStudentCommissionHistory, listStudents, useAcademyRepositoryVersion } from '@/services/academyRepository'
import { calculateAge } from '@/domain/students/studentRules'
import { useWorkspace } from '@/workspace/useWorkspace'

const statusToneMap = {
    Activo: 'success',
    Pendiente: 'warning',
    Inactivo: 'neutral',
} as const

export function StudentDetailPage() {
    useAcademyRepositoryVersion()
    const navigate = useNavigate()
    const { path } = useWorkspace()
    const { studentId } = useParams()
    const [activeTab, setActiveTab] = useState<'overview' | 'courses'>('overview')

    const student = listStudents().find((item) => item.id === studentId)
    const commissionHistory = student ? listStudentCommissionHistory(student.id) : []
    const studentAge = student?.birthDate ? calculateAge(student.birthDate) : null
    const isMinor = studentAge !== null && studentAge < 18


    if (!student) {
        return (
            <div className="dashboard-page">
                <div className="page-header">
                    <div>
                        <h1>Alumno no encontrado</h1>
                    </div>
                </div>
                <div className="data-table-card">
                    <p>El alumno solicitado no existe o fue eliminado.</p>
                    <Link to={path('students')} className="primary-button detail-back-button">
                        Volver a alumnos
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="dashboard-page">
            <div className="page-header compact detail-page-header">
                <div className="detail-page-heading">
                    <div className="detail-breadcrumb">
                        <Link to={path('students')} className="detail-breadcrumb-link">
                            <ArrowLeft size={14} />
                            Alumnos
                        </Link>
                        <span>›</span>
                        <span>{student.id}</span>
                    </div>
                    <h1 className="detail-page-title">{student.fullName}</h1>
                </div>

                <div className="detail-status">
                    <StatusBadge label={student.status} tone={statusToneMap[student.status]} />
                </div>
            </div>

            <div className="data-table-card detail-card">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'courses')}>
                    <TabsList variant="line" aria-label="Detalle de alumno">
                        <TabsTrigger value="overview">Resumen</TabsTrigger>
                        <TabsTrigger value="courses">Cursos y comisiones</TabsTrigger>
                    </TabsList>
                </Tabs>

                {activeTab === 'overview' && (
                    <div className="detail-section">
                        <div className="detail-metric-grid">
                            <div className="detail-metric-card">
                                <div className="detail-metric-label">
                                    <GraduationCap size={14} />
                                    Cursos activos
                                </div>
                                <div className="detail-metric-value detail-metric-value-large">{student.courses.length}</div>
                            </div>

                            <div className="detail-metric-card">
                                <div className="detail-metric-label">
                                    <CalendarDays size={14} />
                                    Fecha de nacimiento
                                </div>
                                <div className="detail-metric-value detail-metric-value-medium">{student.birthDate ?? 'Sin dato'}</div>
                            </div>

                            <div className="detail-metric-card">
                                <div className="detail-metric-label">
                                    <Mail size={14} />
                                    Email
                                </div>
                                <div className="detail-metric-value">{student.email || 'Sin email'}</div>
                            </div>

                            <div className="detail-metric-card">
                                <div className="detail-metric-label">
                                    <Phone size={14} />
                                    Teléfono
                                </div>
                                <div className="detail-metric-value">{student.phone || 'Sin teléfono'}</div>
                            </div>
                        </div>

                        <div className="detail-info-grid">
                            <div className="detail-info-card">
                                <h3 className="detail-info-title">Datos personales</h3>
                                <ul className="detail-info-list">
                                    <li>Documento: {student.document}</li>
                                    <li>Email: {student.email || 'Sin dato'}</li>
                                    <li>Teléfono: {student.phone || 'Sin dato'}</li>
                                    <li>Estado: {student.status}</li>
                                </ul>
                            </div>

                            <div className="detail-info-card">
                                <h3 className="detail-info-title">Notas internas</h3>
                                <p className="detail-info-copy">
                                    {student.notes || 'Sin observaciones registradas.'}
                                </p>
                            </div>

                            {isMinor && (student.tutorName || student.tutorEmail || student.tutorPhone) && <div className="detail-info-card">
                                <h3 className="detail-info-title">Tutor o responsable</h3>
                                <ul className="detail-info-list">
                                    {student.tutorName && <li>Nombre: {student.tutorName}</li>}
                                    {student.tutorEmail && <li>Email: {student.tutorEmail}</li>}
                                    {student.tutorPhone && <li>Teléfono: {student.tutorPhone}</li>}
                                </ul>
                            </div>}
                        </div>
                    </div>
                )}

                {activeTab === 'courses' && (
                    <div className="detail-section">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ color: 'var(--muted)' }}>{commissionHistory.length} comisiones registradas</span>
                        </div>
                        <DataTable
                            rows={commissionHistory}
                            getRowKey={(entry) => `${entry.courseName}-${entry.commissionName}`}
                            onRowClick={(entry) => { if (entry.courseId) navigate(path(`oferta/${entry.courseId}/comisiones/${entry.commissionId}`)) }}
                            emptyLabel="Este alumno todavía no tiene comisiones registradas."
                            columns={[
                                { key: 'course', header: 'Curso', accessor: (entry) => entry.courseName },
                                { key: 'commission', header: 'Comisión', accessor: (entry) => entry.commissionName },
                                { key: 'period', header: 'Vigencia', accessor: (entry) => `${entry.startDate} al ${entry.endDate}` },
                                { key: 'enrolledAt', header: 'Alta', accessor: (entry) => entry.enrolledAt },
                                { key: 'status', header: 'Estado', accessor: (entry) => <StatusBadge label={entry.status} tone={entry.status === 'Activo' ? 'success' : entry.status === 'Pausado' ? 'warning' : 'neutral'} />, align: 'center' },
                            ]}
                        />
                    </div>
                )}

            </div>
        </div>
    )
}
