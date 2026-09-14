import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CommissionForm, type CommissionFormValue } from '@/features/commissions'
import { CourseForm, type CourseFormValue } from '../components/CourseForm'
import { EnrollmentForm, type EnrollmentFormValue } from '@/features/enrollments'
import { DeleteConfirmationModal, EntityFormModal } from '@/components/crud/EntityFormModal'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type AcademicCommission, createCommission, createEnrollmentOpening, listAcademicCycles, listCourses, listEnrollmentOpenings, listPublicRegistrations, listStudentsInCommission, removeCommission, removeEnrollmentOpening, updateCommission, updateCourse, updateEnrollmentOpening, useAcademyRepositoryVersion } from '@/services/academyRepository'
import { validateCommission } from '@/features/commissions'
import { validateEnrollment } from '@/features/enrollments'
import { validateConditions } from '@/components/forms/formValidation'
import { OfferSummaryCard } from '../components/OfferSummaryCard'
import { OfferCommissionsCard } from '../components/OfferCommissionsCard'
import { OfferEnrollmentsCard, type OfferEnrollmentRow } from '../components/OfferEnrollmentsCard'
import { OfferFiltersModal } from '../components/OfferFiltersModal'
import { calculateOccupancy, getEligibleCommissions } from '@/domain/commissions/commissionRules'
import { useWorkspace } from '@/workspace/useWorkspace'

type CourseCommission = AcademicCommission

function formatCommissionSchedule(value: CommissionFormValue) {
    const days = value.days.map((day) => day.slice(0, 3)).join(' / ')
    return days ? `${days} · ${value.fromTime} - ${value.toTime}` : `Horario a definir · ${value.fromTime} - ${value.toTime}`
}


function emptyCommissionForm(startDate = '2026-03-01', endDate = '2026-12-15'): CommissionFormValue {
    return { name: '', teachers: [], capacity: 20, amount: 48000, startDate, endDate, dueDay: 10, status: 'Programada', days: [], fromTime: '18:30', toTime: '20:00' }
}

export function AcademicOfferDetailPage() {
    useAcademyRepositoryVersion()
    const { courseId } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { path } = useWorkspace()
    const courses = listCourses()
    const requestedCommission = courses.find((item) => item.id === courseId)?.commissions.find((commission) => commission.id === searchParams.get('editCommission')) ?? null
    const [activeTab, setActiveTab] = useState<'overview' | 'enrollments'>('overview')
    const [isCreateCommissionOpen, setIsCreateCommissionOpen] = useState(false)
    const [isEditCourseOpen, setIsEditCourseOpen] = useState(false)
    const [isEditCommissionOpen, setIsEditCommissionOpen] = useState(Boolean(requestedCommission))
    const [commissionNameError, setCommissionNameError] = useState('')
    const [isCreateEnrollmentOpen, setIsCreateEnrollmentOpen] = useState(false)
    const [isEditEnrollmentOpen, setIsEditEnrollmentOpen] = useState(false)
    const [newCommissionForm, setNewCommissionForm] = useState<CommissionFormValue>(() => emptyCommissionForm())
    const [courseForm, setCourseForm] = useState<CourseFormValue>({ name: '', duration: '', description: '', status: 'Borrador' })
    const [editingCommissionForm, setEditingCommissionForm] = useState<CommissionFormValue>(() => ({ name: requestedCommission?.name ?? '', teachers: requestedCommission?.teachers ?? (requestedCommission?.teacher ? [requestedCommission.teacher] : []), capacity: requestedCommission?.capacity ?? 20, amount: requestedCommission?.amount ?? 48000, startDate: requestedCommission?.startDate ?? '2026-03-01', endDate: requestedCommission?.endDate ?? '2026-12-15', dueDay: requestedCommission?.dueDay ?? 10, status: requestedCommission?.status ?? 'Programada', days: [], fromTime: '18:30', toTime: '20:00' }))
    const [editingCommission, setEditingCommission] = useState<CourseCommission | null>(requestedCommission)
    const [viewCommission, setViewCommission] = useState<CourseCommission | null>(null)
    const [deleteCommissionTarget, setDeleteCommissionTarget] = useState<CourseCommission | null>(null)
    const [editingEnrollment, setEditingEnrollment] = useState<OfferEnrollmentRow | null>(null)
    const [enrollmentForm, setEnrollmentForm] = useState<EnrollmentFormValue>({ courseId: courseId ?? '', commissionIds: [], amount: 48000, startDate: '2026-08-26', endDate: '2026-08-30', status: 'Abierta' })
    const [viewEnrollment, setViewEnrollment] = useState<OfferEnrollmentRow | null>(null)
    const [deleteEnrollmentTarget, setDeleteEnrollmentTarget] = useState<OfferEnrollmentRow | null>(null)
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [commissionSearch, setCommissionSearch] = useState('')
    const [isCommissionFilterOpen, setIsCommissionFilterOpen] = useState(false)
    const [commissionFilters, setCommissionFilters] = useState<Record<string, string>>({})
    const [enrollmentSearch, setEnrollmentSearch] = useState('')
    const [isEnrollmentFilterOpen, setIsEnrollmentFilterOpen] = useState(false)
    const [enrollmentFilters, setEnrollmentFilters] = useState<Record<string, string>>({})
    const course = courses.find((entry) => entry.id === courseId)

    if (!course) {
        return <div className="dashboard-page"><div className="page-header"><div><h1>Oferta académica no encontrada</h1></div></div><div className="data-table-card"><p>La oferta académica solicitada no existe o fue eliminada.</p><Link to={path('offers')} className="primary-button" style={{ display: 'inline-flex', marginTop: 12 }}>Volver a oferta académica</Link></div></div>
    }

    const persistedEnrollmentRows = listEnrollmentOpenings(course.id)
        .map((opening) => {
            const eligibleCommissions = getEligibleCommissions(course.commissions, opening.startDate, opening.endDate)
            const selectedCommissionIds = opening.commissionIds ?? eligibleCommissions.map((commission) => commission.id)
            const eligibleCount = eligibleCommissions.filter((commission) => selectedCommissionIds.includes(commission.id)).length
            return {
                id: opening.id,
                courseId: opening.courseId,
                commissionIds: selectedCommissionIds,
                commissions: `${eligibleCount} ${eligibleCount === 1 ? 'comisión' : 'comisiones'}`,
                amount: opening.amount,
                startDate: opening.startDate,
                endDate: opening.endDate,
                status: opening.status,
                studentsCount: listPublicRegistrations(opening.id).length,
            }
        })
    const allEnrollmentRows = persistedEnrollmentRows
    const assignedStudents = course.commissions.reduce((total, commission) => total + listStudentsInCommission(course.name, commission.name, commission.id).length, 0)
    const totalCapacity = course.commissions.reduce((total, commission) => total + commission.capacity, 0)
    const occupancyPercentage = calculateOccupancy(assignedStudents, totalCapacity)
    const activeCommissions = course.commissions.filter((commission) => commission.status === 'Activa').length
    const openEnrollments = allEnrollmentRows.filter((enrollment) => enrollment.status === 'Abierta')
    const commissionFilterFields = [
        { key: 'commission', label: 'Comisión', options: course.commissions.map((commission) => commission.name) },
        { key: 'teacher', label: 'Profesor', options: Array.from(new Set(course.commissions.flatMap((commission) => commission.teachers))) },
        { key: 'schedule', label: 'Horario', options: Array.from(new Set(course.commissions.map((commission) => commission.schedule))) },
        { key: 'status', label: 'Estado', options: Array.from(new Set(course.commissions.map((commission) => commission.status))) },
    ]

    const enrollmentFilterFields = [
        { key: 'status', label: 'Estado', options: Array.from(new Set(allEnrollmentRows.map((item) => item.status))) },
    ]

    const filteredCommissions = course.commissions.filter((commission) => {
        const matchesSearch = !commissionSearch || [
            commission.name,
            commission.teachers.join(' '),
            commission.schedule,
            commission.status,
            course.name,
        ].some((value) => value.toLowerCase().includes(commissionSearch.toLowerCase()))

        const matchesFilters = commissionFilterFields.every((field) => {
            const selectedValue = commissionFilters[field.key]
            if (!selectedValue) {
                return true
            }

            const fieldValue = {
                commission: commission.name,
                teacher: commission.teachers.join(', '),
                schedule: commission.schedule,
                status: commission.status,
            }[field.key]

            return fieldValue === selectedValue
        })

        return matchesSearch && matchesFilters
    })

    const filteredEnrollments = allEnrollmentRows.filter((enrollment) => {
        const matchesSearch = !enrollmentSearch || [
            enrollment.commissions,
            enrollment.status,
            String(enrollment.amount),
            enrollment.startDate,
            enrollment.endDate,
        ].some((value) => value.toLowerCase().includes(enrollmentSearch.toLowerCase()))

        const matchesFilters = enrollmentFilterFields.every((field) => {
            const selectedValue = enrollmentFilters[field.key]
            if (!selectedValue) {
                return true
            }

            const fieldValue = {
                status: enrollment.status,
            }[field.key]

            return fieldValue === selectedValue
        })

        return matchesSearch && matchesFilters
    })

    const handleDuplicateCommission = (commission: (typeof course.commissions)[number]) => {
        createCommission(course.id, { ...commission, name: `${commission.name} (copia)`, studentsCount: 0, status: 'Programada' })
    }

    const openEditCommissionModal = (commission: (typeof course.commissions)[number]) => {
        setEditingCommission(commission)
        setEditingCommissionForm({ name: commission.name, teachers: commission.teachers, capacity: commission.capacity, amount: commission.amount, startDate: commission.startDate, endDate: commission.endDate, dueDay: commission.dueDay, status: commission.status, days: ['Lunes', 'Miércoles', 'Viernes'].filter((day) => commission.schedule.includes(day.slice(0, 3))), fromTime: commission.schedule.match(/(\d{2}:\d{2})/)?.[1] ?? '18:30', toTime: commission.schedule.match(/-\s*(\d{2}:\d{2})/)?.[1] ?? '20:00' })
        setIsEditCommissionOpen(true)
    }

    const openEditEnrollmentModal = (enrollment: OfferEnrollmentRow) => {
        setEditingEnrollment(enrollment)
        setEnrollmentForm({ courseId: enrollment.courseId, commissionIds: enrollment.commissionIds, amount: enrollment.amount, startDate: enrollment.startDate, endDate: enrollment.endDate, status: enrollment.status })
        setIsEditEnrollmentOpen(true)
    }

    if (!course) {
        return (
            <div className="dashboard-page">
                <div className="page-header">
                    <div>
                        <h1>Oferta académica no encontrada</h1>
                    </div>
                </div>
                <div className="data-table-card">
                    <p>La oferta académica solicitada no existe o fue eliminada.</p>
                    <Link to={path('offers')} className="primary-button" style={{ display: 'inline-flex', marginTop: 12 }}>
                        Volver a oferta académica
                    </Link>
                </div>
            </div>
        )
    }

    const academicCycle = listAcademicCycles().find((cycle) => cycle.id === course.cycleId)

    return (
        <div className="dashboard-page">
            <div className="page-header compact">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', color: 'var(--muted)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        <Link to={path('offers')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted)', textDecoration: 'none' }}>
                            <ArrowLeft size={14} />
                            Oferta académica
                        </Link>
                        <span>›</span>
                        <span>{course.name}</span>
                    </div>
                    <h1 style={{ marginTop: 16 }}>{course.name}</h1>
                    <p style={{ marginTop: 6, color: 'var(--muted)' }}>{academicCycle?.name ?? 'Ciclo lectivo sin definir'}</p>
                </div>
            </div>

            <EntityFormModal
                open={isEditCourseOpen}
                title="Editar oferta académica"
                subtitle="Actualizá la información general de esta oferta."
                validate={() => validateConditions({ courseName: !courseForm.name.trim() && 'Ingresá el nombre de la oferta.' })}
                onClose={() => setIsEditCourseOpen(false)}
                onSubmit={() => {
                    if (courseForm.name.trim()) updateCourse(course.id, { ...courseForm, name: courseForm.name.trim() })
                    setIsEditCourseOpen(false)
                }}
            >
                <CourseForm value={courseForm} onValueChange={setCourseForm} />
            </EntityFormModal>

            <EntityFormModal
                open={isCreateCommissionOpen}
                title="Nueva comisión"
                subtitle="Creá una nueva instancia de la oferta académica con su propio horario, docente y valor mensual."
                validate={() => validateCommission(newCommissionForm, course.commissions.map((commission) => commission.name))}
                onClose={() => {
                    setIsCreateCommissionOpen(false)
                    setCommissionNameError('')
                    setNewCommissionForm(emptyCommissionForm(academicCycle?.startDate, academicCycle?.endDate))
                }}
                onSubmit={() => {
                    const draftCommission = {
                        name: newCommissionForm.name.trim() || `Comisión ${course.commissions.length + 1}`,
                        teacher: newCommissionForm.teachers[0] || 'Docente por asignar',
                        teachers: newCommissionForm.teachers,
                        schedule: formatCommissionSchedule(newCommissionForm),
                        studentsCount: 0,
                        capacity: newCommissionForm.capacity,
                        amount: newCommissionForm.amount,
                        startDate: newCommissionForm.startDate,
                        endDate: newCommissionForm.endDate,
                        dueDay: newCommissionForm.dueDay,
                        status: newCommissionForm.status,
                    }
                    const created = createCommission(course.id, draftCommission)
                    if (!created) {
                        setCommissionNameError('Ya existe una comisión con ese nombre dentro de esta oferta académica.')
                        return
                    }

                    setIsCreateCommissionOpen(false)
                    setCommissionNameError('')
                    setNewCommissionForm(emptyCommissionForm(academicCycle?.startDate, academicCycle?.endDate))
                }}
            >
                <>
                    <CommissionForm initialValues={{ course: course.name }} value={newCommissionForm} onValueChange={(value) => { setNewCommissionForm(value); setCommissionNameError('') }} />
                    {commissionNameError && <p className="form-error-message" role="alert">{commissionNameError}</p>}
                </>
            </EntityFormModal>

            <EntityFormModal
                open={isEditCommissionOpen}
                title="Editar comisión"
                subtitle="Actualizá los datos de la comisión."
                validate={() => validateCommission(editingCommissionForm, course.commissions.filter((commission) => commission.id !== editingCommission?.id).map((commission) => commission.name))}
                onClose={() => {
                    setIsEditCommissionOpen(false)
                    setEditingCommission(null)
                    setCommissionNameError('')
                }}
                onSubmit={() => {
                    if (editingCommission) {
                        const changes = { ...editingCommissionForm, name: editingCommissionForm.name.trim() || editingCommission.name, teacher: editingCommissionForm.teachers[0] || 'Docente por asignar', schedule: formatCommissionSchedule(editingCommissionForm) }
                        const updated = updateCommission(course.id, editingCommission.id, changes)
                        if (!updated) {
                            setCommissionNameError('Ya existe otra comisión con ese nombre dentro de esta oferta académica.')
                            return
                        }
                    }
                    setIsEditCommissionOpen(false)
                    setEditingCommission(null)
                    setCommissionNameError('')
                }}
            >
                <>
                    <CommissionForm
                        value={editingCommissionForm}
                        onValueChange={(value) => { setEditingCommissionForm(value); setCommissionNameError('') }}
                        initialValues={
                            editingCommission ? {
                                name: editingCommission.name,
                                course: course.name,
                                teachers: editingCommission.teachers,
                                capacity: editingCommission.capacity,
                                amount: editingCommission.amount,
                                startDate: editingCommission.startDate,
                                endDate: editingCommission.endDate,
                                dueDay: editingCommission.dueDay,
                                status: editingCommission.status,
                                schedule: editingCommission.schedule,
                            } : undefined
                        }
                    />
                    {commissionNameError && <p className="form-error-message" role="alert">{commissionNameError}</p>}
                </>
            </EntityFormModal>

            <EntityFormModal
                open={Boolean(viewCommission)}
                title="Detalle de comisión"
                subtitle="Información actual de la comisión seleccionada."
                submitLabel="Cerrar"
                onClose={() => setViewCommission(null)}
                onSubmit={() => setViewCommission(null)}
            >
                {viewCommission && (
                    <CommissionForm
                        initialValues={
                            viewCommission ? {
                                name: viewCommission.name,
                                course: course.name,
                                teachers: viewCommission.teachers,
                                capacity: viewCommission.capacity,
                                amount: viewCommission.amount,
                                startDate: viewCommission.startDate,
                                endDate: viewCommission.endDate,
                                dueDay: viewCommission.dueDay,
                                status: viewCommission.status,
                                schedule: viewCommission.schedule,
                            } : undefined
                        }
                    />
                )}
            </EntityFormModal>

            <DeleteConfirmationModal
                open={Boolean(deleteCommissionTarget)}
                title="Eliminar comisión"
                description={`¿Estás seguro que querés eliminar "${deleteCommissionTarget?.name}"? Esta acción no se puede deshacer.`}
                onClose={() => setDeleteCommissionTarget(null)}
                onConfirm={() => {
                    if (deleteCommissionTarget) {
                        removeCommission(course.id, deleteCommissionTarget.id)
                    }
                    setDeleteCommissionTarget(null)
                }}
            />

            <EntityFormModal
                open={isCreateEnrollmentOpen}
                title="Lanzar inscripción"
                subtitle={`Definí la inscripción para ${course.name}.`}
                validate={() => validateEnrollment(enrollmentForm, course.commissions)}
                onClose={() => setIsCreateEnrollmentOpen(false)}
                onSubmit={() => {
                    const createdEnrollmentId = createEnrollmentOpening({ ...enrollmentForm, courseId: course.id }).id
                    setEnrollmentForm({ courseId: course.id, commissionIds: [], amount: 48000, startDate: '2026-08-26', endDate: '2026-08-30', status: 'Abierta' })
                    setIsCreateEnrollmentOpen(false)
                    navigate(path(`oferta/${course.id}/inscripciones/${createdEnrollmentId}`))
                }}
            >
                <EnrollmentForm
                    courseName={course.name}
                    commissions={course.commissions}
                    value={enrollmentForm}
                    onValueChange={setEnrollmentForm}
                />
            </EntityFormModal>

            <EntityFormModal
                open={isEditEnrollmentOpen}
                title="Editar inscripción"
                subtitle="Actualizá la inscripción seleccionada."
                validate={() => validateEnrollment(enrollmentForm, course.commissions)}
                onClose={() => {
                    setIsEditEnrollmentOpen(false)
                    setEditingEnrollment(null)
                }}
                onSubmit={() => {
                    if (editingEnrollment && enrollmentForm.commissionIds.length > 0) {
                        updateEnrollmentOpening(editingEnrollment.id, enrollmentForm)
                    }
                    setIsEditEnrollmentOpen(false)
                    setEditingEnrollment(null)
                }}
            >
                <EnrollmentForm
                    courseName={course.name}
                    commissions={course.commissions}
                    value={enrollmentForm}
                    onValueChange={setEnrollmentForm}
                />
            </EntityFormModal>

            <EntityFormModal
                open={Boolean(viewEnrollment)}
                title="Detalle de inscripción"
                subtitle="Resumen de la inscripción seleccionada."
                submitLabel="Cerrar"
                onClose={() => setViewEnrollment(null)}
                onSubmit={() => setViewEnrollment(null)}
            >
                {viewEnrollment && (
                    <EnrollmentForm
                        courseName={course.name}
                        commissions={course.commissions}
                        initialValues={{
                            courseId: course.id,
                            commissionIds: viewEnrollment.commissionIds,
                            amount: viewEnrollment.amount,
                            startDate: viewEnrollment.startDate,
                            endDate: viewEnrollment.endDate,
                            status: viewEnrollment.status,
                        }}
                    />
                )}
            </EntityFormModal>

            <DeleteConfirmationModal
                open={Boolean(deleteEnrollmentTarget)}
                title="Cancelar inscripción"
                description={`¿Estás seguro que querés cancelar la inscripción para "${course.name}"? Esta acción no se puede deshacer.`}
                onClose={() => setDeleteEnrollmentTarget(null)}
                onConfirm={() => {
                    if (deleteEnrollmentTarget) {
                        removeEnrollmentOpening(deleteEnrollmentTarget.id)
                    }
                    setDeleteEnrollmentTarget(null)
                }}
            />

            <OfferFiltersModal open={isCommissionFilterOpen} title="Filtros de comisiones" fields={commissionFilterFields} values={commissionFilters} onChange={setCommissionFilters} onClose={() => setIsCommissionFilterOpen(false)} />

            <OfferFiltersModal open={isEnrollmentFilterOpen} title="Filtros de inscripciones" fields={enrollmentFilterFields} values={enrollmentFilters} onChange={setEnrollmentFilters} onClose={() => setIsEnrollmentFilterOpen(false)} />

            <div className="academy-tabs-wrap">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'enrollments')}>
                    <TabsList variant="line" aria-label="Detalle del curso">
                        <TabsTrigger value="overview">Resumen</TabsTrigger>
                        <TabsTrigger value="enrollments">Inscripciones</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="offer-detail-stack">
                    {activeTab === 'overview' && (
                        <OfferSummaryCard
                            course={course}
                            assignedStudents={assignedStudents}
                            totalCapacity={totalCapacity}
                            occupancyPercentage={occupancyPercentage}
                            activeCommissions={activeCommissions}
                            openEnrollments={openEnrollments.length}
                            onEdit={() => {
                                setCourseForm({ name: course.name, duration: course.duration ?? '', description: course.description ?? '', status: course.status })
                                setIsEditCourseOpen(true)
                            }}
                        />
                    )}

                    {activeTab === 'overview' && (
                        <OfferCommissionsCard
                            rows={filteredCommissions}
                            search={commissionSearch}
                            openMenuId={openMenuId}
                            onSearchChange={setCommissionSearch}
                            onOpenFilters={() => setIsCommissionFilterOpen(true)}
                            onCreate={() => {
                                setNewCommissionForm(emptyCommissionForm(academicCycle?.startDate, academicCycle?.endDate))
                                setIsCreateCommissionOpen(true)
                            }}
                            onToggleMenu={(id) => setOpenMenuId((current) => current === id ? null : id)}
                            onView={(commission) => navigate(path(`oferta/${course.id}/comisiones/${commission.id}`))}
                            onDuplicate={handleDuplicateCommission}
                            onEdit={openEditCommissionModal}
                            onDelete={setDeleteCommissionTarget}
                        />
                    )}

                    {activeTab === 'enrollments' && (
                        <OfferEnrollmentsCard
                            courseName={course.name}
                            rows={filteredEnrollments}
                            search={enrollmentSearch}
                            openMenuId={openMenuId}
                            onSearchChange={setEnrollmentSearch}
                            onOpenFilters={() => setIsEnrollmentFilterOpen(true)}
                            onCreate={() => {
                                const startDate = '2026-08-26'
                                const endDate = '2026-08-30'
                                const commissionIds = getEligibleCommissions(course.commissions, startDate, endDate).map((commission) => commission.id)
                                setEnrollmentForm({ courseId: course.id, commissionIds, amount: course.commissions[0]?.amount ?? 48000, startDate, endDate, status: 'Abierta' })
                                setIsCreateEnrollmentOpen(true)
                            }}
                            onToggleMenu={(id) => setOpenMenuId((current) => current === id ? null : id)}
                            onView={(enrollment) => navigate(path(`oferta/${course.id}/inscripciones/${enrollment.id}`))}
                            onEdit={openEditEnrollmentModal}
                            onCloseEnrollment={(enrollment) => updateEnrollmentOpening(enrollment.id, { status: 'Cerrada' })}
                            onDelete={setDeleteEnrollmentTarget}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
