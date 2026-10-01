import { Eye, PencilLine, Trash2, BookOpen, CalendarPlus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CourseForm, type CourseFormValue } from '../components/CourseForm'
import { CrudListPage } from '@/components/crud/CrudListPage'
import { DeleteConfirmationModal, EntityFormModal } from '@/components/crud/EntityFormModal'
import { validateConditions } from '@/components/forms/formValidation'
import { PrivateLessonForm, type PrivateLessonFormValue } from '../components/PrivateLessonForm'
import { useCrudList } from '@/hooks/useCrudList'
import { DataTable } from '@/components/ui/DataTable'
import { EntityCell } from '@/components/ui/PersonCell'
import { RowActionMenu } from '@/components/ui/RowActionMenu'
import { StatusBadge, type StatusBadgeTone } from '@/components/ui/StatusBadge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type AcademicCourse, getActiveAcademicCycleId, getCourseRemovalBlockers, listAcademicCycles, listCourses, listPrivateLessons, listStaff, listStudents, useAcademyRepositoryVersion, useActivateCycle, useCreateCourse, useCreateCycle, useCreatePrivateLesson, useDeleteCourse, useUpdateCourse, useUpdatePrivateLesson } from '@/services/academyRepository'
import { PrivateLessonsTable, type PrivateStudentRow } from '../components/PrivateLessonsTable'
import { useToast } from '@/components/ui/ToastContext'
import { useSelectedBranchId } from '@/services/branchRepository'
import { useWorkspace } from '@/workspace/useWorkspace'

export type Course = AcademicCourse

const statusToneMap: Record<Course['status'], StatusBadgeTone> = {
    Activo: 'success',
    Borrador: 'warning',
    Cerrado: 'neutral',
}

export function AcademicOffersPage() {
    const navigate = useNavigate()
    const { path } = useWorkspace()
    const [searchParams] = useSearchParams()
    useAcademyRepositoryVersion()
    const students = listStudents()
    const requestedStudentId = searchParams.get('student') ?? students[0]?.id ?? ''
    const opensPrivateLesson = searchParams.get('tab') === 'private' && Boolean(searchParams.get('student'))
    const [activeTab, setActiveTab] = useState<'groups' | 'private'>(() => searchParams.get('tab') === 'private' ? 'private' : 'groups')
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [createCourseError, setCreateCourseError] = useState('')
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editCourseError, setEditCourseError] = useState('')
    const [editingCourse, setEditingCourse] = useState<Course | null>(null)
    const [courseForm, setCourseForm] = useState<CourseFormValue>({ name: '', description: '', status: 'Borrador' })
    const [deleteTarget, setDeleteTarget] = useState<Course | null>(null)
    const cycles = listAcademicCycles()
    const activeCycleId = getActiveAcademicCycleId()
    const [isCreateCycleOpen, setIsCreateCycleOpen] = useState(false)
    const [cycleForm, setCycleForm] = useState({ name: '', startDate: '2027-01-01', endDate: '2027-12-31' })
    const createCycle = useCreateCycle()
    const activateCycle = useActivateCycle()
    const createCourse = useCreateCourse()
    const updateCourse = useUpdateCourse()
    const deleteCourse = useDeleteCourse()
    const createPrivateLesson = useCreatePrivateLesson()
    const updatePrivateLesson = useUpdatePrivateLesson()
    const { showToast } = useToast()
    const selectedBranchId = useSelectedBranchId()
    const courseItems = listCourses().filter((course) => course.cycleId === activeCycleId && course.branchId === selectedBranchId)
    const [courseFilters, setCourseFilters] = useState({ course: '', teacher: '', status: '' })
    const [privateFilters, setPrivateFilters] = useState({ teacher: '', plan: '', status: '' })
    const filteredCourseItems = courseItems.filter((course) =>
        (!courseFilters.course || course.name === courseFilters.course)
        && (!courseFilters.teacher || course.commissions.some((commission) => commission.teachers.includes(courseFilters.teacher)))
        && (!courseFilters.status || course.status === courseFilters.status),
    )
    const removalBlockers = deleteTarget ? getCourseRemovalBlockers(deleteTarget.id) : []
    const [isPrivateModalOpen, setIsPrivateModalOpen] = useState(opensPrivateLesson)
    const [editingPrivateLessonId, setEditingPrivateLessonId] = useState<string | null>(null)
    const [privateLessonForm, setPrivateLessonForm] = useState<PrivateLessonFormValue>({
        studentId: requestedStudentId,
        teacherId: '',
        purpose: 'Apoyo escolar',
        plan: 'Clase individual',
        startDate: '2026-03-01',
        endDate: '2026-12-15',
        days: ['Lunes'],
        fromTime: '18:00',
        toTime: '19:00',
        costPerClass: '',
    })
    const studentsById = new Map(students.map((student) => [student.id, student]))
    const teacherOptions = listStaff().filter((teacher) => teacher.role === 'Docente' && teacher.status === 'Activo').map((teacher) => ({ id: teacher.id, fullName: teacher.fullName }))
    const teachersById = new Map(listStaff().map((teacher) => [teacher.id, teacher]))
    const privateStudentsItems: PrivateStudentRow[] = listPrivateLessons().flatMap((lesson) => {
        const student = studentsById.get(lesson.studentId)
        if (!student) return []
        const balance = lesson.plan === 'Pack 4 clases' ? 4 : lesson.plan === 'Pack 8 clases' ? 8 : lesson.plan === 'Pack 12 clases' ? 12 : 1

        return [{
            id: lesson.id,
            studentId: lesson.studentId,
            student: student.fullName,
            teacherId: lesson.teacherId,
            teacher: teachersById.get(lesson.teacherId)?.fullName ?? 'Docente no encontrado',
            purpose: lesson.purpose,
            plan: lesson.plan,
            startDate: lesson.startDate,
            endDate: lesson.endDate,
            costPerClass: lesson.costPerClass,
            nextClass: `${lesson.days.join(', ')} · ${lesson.fromTime} a ${lesson.toTime}`,
            balance,
            days: lesson.days,
            fromTime: lesson.fromTime,
            toTime: lesson.toTime,
            status: lesson.status,
        }]
    })
    const filteredPrivateStudentsItems = privateStudentsItems.filter((item) =>
        (!privateFilters.teacher || item.teacher === privateFilters.teacher)
        && (!privateFilters.plan || item.plan === privateFilters.plan)
        && (!privateFilters.status || item.status === privateFilters.status),
    )

    const {
        search,
        setSearch,
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedItems: paginatedCourses,
    } = useCrudList<Course>({
        items: filteredCourseItems,
        pageSize: 10,
        searchFields: [
            (course) => course.name,
            (course) => course.commissions.flatMap((commission) => commission.teachers).join(' '),
        ],
    })

    const {
        search: privateSearch,
        setSearch: setPrivateSearch,
        currentPage: privateCurrentPage,
        setCurrentPage: setPrivateCurrentPage,
        totalPages: privateTotalPages,
        paginatedItems: paginatedPrivateStudents,
    } = useCrudList<PrivateStudentRow>({
        items: filteredPrivateStudentsItems,
        pageSize: 10,
        searchFields: [
            (item) => `${item.student} ${item.teacher} ${item.purpose} ${item.plan}`,
            (item) => item.nextClass,
            (item) => item.status,
        ],
    })

    const privateStudentOptions = students.map((student) => ({ id: student.id, label: `${student.fullName} · ${student.document}` }))

    const submitPrivateLesson = () => {
        const student = students.find((item) => item.id === privateLessonForm.studentId)!
        const costPerClass = Number(privateLessonForm.costPerClass)

        const lessonData = {
            studentId: student.id,
            teacherId: privateLessonForm.teacherId,
            purpose: privateLessonForm.purpose,
            plan: privateLessonForm.plan,
            startDate: privateLessonForm.startDate,
            endDate: privateLessonForm.endDate,
            costPerClass,
            days: privateLessonForm.days,
            fromTime: privateLessonForm.fromTime,
            toTime: privateLessonForm.toTime,
        }

        if (editingPrivateLessonId) {
            updatePrivateLesson.mutate({ id: editingPrivateLessonId, changes: { ...lessonData, status: 'Activa' } }, {
                onSuccess: () => showToast('success', 'Clase particular actualizada correctamente.'),
                onError: () => showToast('error', 'No se pudo actualizar la clase particular. Intentá nuevamente.'),
            })
        } else {
            createPrivateLesson.mutate(lessonData, {
                onSuccess: (result) => showToast(result.chargeFailed ? 'error' : 'success', result.chargeFailed ? 'Se creó la clase particular, pero no se pudo generar el cargo en Facturación.' : 'Clase particular creada correctamente.'),
                onError: () => showToast('error', 'No se pudo crear la clase particular. Intentá nuevamente.'),
            })
        }

        setPrivateLessonForm({
            studentId: students[0]?.id ?? '',
            teacherId: '',
            purpose: 'Apoyo escolar',
            plan: 'Clase individual',
            startDate: '2026-03-01',
            endDate: '2026-12-15',
            days: ['Lunes'],
            fromTime: '18:00',
            toTime: '19:00',
            costPerClass: '',
        })
        setEditingPrivateLessonId(null)
        setIsPrivateModalOpen(false)
    }

    return (
        <>
            <EntityFormModal
                open={isCreateCycleOpen}
                title="Nuevo ciclo lectivo"
                subtitle="Creá el período que organizará la oferta, las comisiones y sus inscripciones."
                submitLabel="Crear ciclo"
                validate={() => validateConditions({ cycleName: !cycleForm.name.trim() && 'Ingresá el nombre.', cycleStartDate: !cycleForm.startDate && 'Ingresá el inicio.', cycleEndDate: (!cycleForm.endDate || cycleForm.endDate < cycleForm.startDate) && 'Ingresá una fecha de fin válida.' }, 'Revisá los datos del ciclo.')}
                onClose={() => setIsCreateCycleOpen(false)}
                onSubmit={() => {
                    createCycle.mutate({ ...cycleForm, name: cycleForm.name.trim(), status: 'Borrador' }, {
                        onSuccess: (created) => {
                            activateCycle.mutate(created.id, {
                                onSuccess: () => showToast('success', 'Ciclo lectivo creado y activado correctamente.'),
                                onError: () => showToast('error', 'El ciclo se creó, pero no se pudo activar automáticamente. Activalo desde el selector de ciclo lectivo.'),
                            })
                        },
                        onError: () => showToast('error', 'No se pudo crear el ciclo lectivo. Intentá nuevamente.'),
                    })
                    setIsCreateCycleOpen(false)
                }}
            >
                <div className="form-grid">
                    <label className="form-field"><span className="form-field-label"><span>Nombre <b className="form-required-mark">*</b></span></span><input className="form-input" value={cycleForm.name} onChange={(event) => setCycleForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ej: Ciclo lectivo 2027" /></label>
                    <label className="form-field"><span className="form-field-label"><span>Fecha de inicio <b className="form-required-mark">*</b></span></span><input className="form-input" type="date" value={cycleForm.startDate} onChange={(event) => setCycleForm((current) => ({ ...current, startDate: event.target.value }))} /></label>
                    <label className="form-field"><span className="form-field-label"><span>Fecha de cierre <b className="form-required-mark">*</b></span></span><input className="form-input" type="date" value={cycleForm.endDate} onChange={(event) => setCycleForm((current) => ({ ...current, endDate: event.target.value }))} /></label>
                </div>
            </EntityFormModal>

            <EntityFormModal
                open={isCreateModalOpen}
                title="Nueva oferta académica"
                subtitle="Completa los datos principales de la oferta académica."
                validate={() => validateConditions({ courseName: !courseForm.name.trim() && 'Ingresá el nombre de la oferta.' })}
                onClose={() => { setIsCreateModalOpen(false); setCreateCourseError('') }}
                onSubmit={() => {
                    setCreateCourseError('')
                    if (!courseForm.name.trim()) { setIsCreateModalOpen(false); return }
                    if (!selectedBranchId) {
                        setCreateCourseError('Elegí una sede en la barra superior antes de crear un curso.')
                        return
                    }
                    if (!activeCycleId) {
                        setCreateCourseError(cycles.length === 0 ? 'Creá un ciclo lectivo antes de crear una oferta académica.' : 'Activá un ciclo lectivo en el selector de arriba antes de crear una oferta académica.')
                        return
                    }
                    createCourse.mutate({ form: courseForm, cycleId: activeCycleId }, {
                        onSuccess: () => {
                            setIsCreateModalOpen(false)
                            showToast('success', 'Oferta académica creada correctamente.')
                        },
                        onError: () => setCreateCourseError('No se pudo crear la oferta académica. Intentá nuevamente.'),
                    })
                }}
            >
                <CourseForm value={courseForm} onValueChange={setCourseForm} />
                {createCourseError && <p className="form-error-message" role="alert">{createCourseError}</p>}
            </EntityFormModal>

            <EntityFormModal
                open={isEditModalOpen}
                title="Editar oferta académica"
                subtitle="Actualiza los datos principales de la oferta académica."
                validate={() => validateConditions({ courseName: !courseForm.name.trim() && 'Ingresá el nombre de la oferta.' })}
                onClose={() => {
                    setIsEditModalOpen(false)
                    setEditingCourse(null)
                    setEditCourseError('')
                }}
                onSubmit={() => {
                    setEditCourseError('')
                    if (!editingCourse || !courseForm.name.trim()) {
                        setIsEditModalOpen(false)
                        setEditingCourse(null)
                        return
                    }
                    updateCourse.mutate({ id: editingCourse.id, changes: courseForm }, {
                        onSuccess: () => {
                            setIsEditModalOpen(false)
                            setEditingCourse(null)
                            showToast('success', 'Oferta académica actualizada correctamente.')
                        },
                        onError: () => setEditCourseError('No se pudo actualizar la oferta académica. Intentá nuevamente.'),
                    })
                }}
            >
                <CourseForm
                    value={courseForm}
                    onValueChange={setCourseForm}
                    initialValues={{
                        name: editingCourse?.name,
                        description: 'Oferta académica orientada a nivel inicial con foco en speaking y listening.',
                    }}
                />
                {editCourseError && <p className="form-error-message" role="alert">{editCourseError}</p>}
            </EntityFormModal>

            <DeleteConfirmationModal
                open={Boolean(deleteTarget)}
                title="Eliminar oferta académica"
                description={removalBlockers.length > 0 ? `No se puede eliminar "${deleteTarget?.name}" porque tiene ${removalBlockers.join(', ')}. Cerrá o resolvé estos vínculos antes de eliminarla.` : `¿Estás seguro que querés eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
                confirmLabel={removalBlockers.length > 0 ? 'Entendido' : undefined}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => {
                    if (deleteTarget && removalBlockers.length === 0) {
                        deleteCourse.mutate(deleteTarget.id, {
                            onSuccess: () => showToast('success', 'Oferta académica eliminada correctamente.'),
                            onError: () => showToast('error', 'No se pudo eliminar la oferta académica. Intentá nuevamente.'),
                        })
                    }
                    setDeleteTarget(null)
                }}
            />

            <EntityFormModal
                open={isPrivateModalOpen}
                title={editingPrivateLessonId ? 'Reprogramar clase particular' : 'Nuevo particular'}
                subtitle={editingPrivateLessonId ? 'Actualizá la agenda o las condiciones de la clase.' : 'Seleccioná un alumno y completá los datos de la clase particular.'}
                submitLabel={editingPrivateLessonId ? 'Guardar cambios' : 'Crear particular'}
                validate={() => validateConditions({ privateStudent: !students.some((student) => student.id === privateLessonForm.studentId) && 'Seleccioná un alumno.', privateTeacher: !privateLessonForm.teacherId && 'Seleccioná un docente.', privatePurpose: !privateLessonForm.purpose.trim() && 'Ingresá el motivo.', privateCost: Number(privateLessonForm.costPerClass) <= 0 && 'Ingresá un costo válido.', privateStart: !privateLessonForm.startDate && 'Ingresá el inicio.', privateEnd: (!privateLessonForm.endDate || privateLessonForm.endDate < privateLessonForm.startDate) && 'Ingresá una fecha de fin válida.', privateDays: privateLessonForm.days.length === 0 && 'Seleccioná al menos un día.', privateTime: (!privateLessonForm.fromTime || !privateLessonForm.toTime || privateLessonForm.toTime <= privateLessonForm.fromTime) && 'Ingresá un horario válido.' }, 'Revisá los datos de la clase particular.')}
                onClose={() => {
                    setEditingPrivateLessonId(null)
                    setIsPrivateModalOpen(false)
                }}
                onSubmit={submitPrivateLesson}
            >
                <PrivateLessonForm value={privateLessonForm} onChange={setPrivateLessonForm} studentOptions={privateStudentOptions} teacherOptions={teacherOptions} />
            </EntityFormModal>

            <CrudListPage
                contentInset
                title="Oferta académica"
                description="Catálogo de cursos grupales y clases particulares."
                searchValue={activeTab === 'groups' ? search : privateSearch}
                onSearchChange={activeTab === 'groups' ? setSearch : setPrivateSearch}
                searchPlaceholder={activeTab === 'groups' ? 'Buscar oferta académica o docente' : 'Buscar alumno, docente o plan'}
                filterFields={activeTab === 'groups' ? [
                    { key: 'course', label: 'Oferta académica', options: courseItems.map((course) => course.name) },
                    { key: 'teacher', label: 'Profesor', options: Array.from(new Set(courseItems.flatMap((course) => course.commissions.flatMap((commission) => commission.teachers)))) },
                    { key: 'status', label: 'Estado', options: Array.from(new Set(courseItems.map((course) => course.status))) },
                ] : [
                    { key: 'teacher', label: 'Docente', options: Array.from(new Set(privateStudentsItems.map((item) => item.teacher))) },
                    { key: 'plan', label: 'Plan', options: Array.from(new Set(privateStudentsItems.map((item) => item.plan))) },
                    { key: 'status', label: 'Estado', options: Array.from(new Set(privateStudentsItems.map((item) => item.status))) },
                ]}
                onApplyFilters={(filters) => {
                    if (activeTab === 'groups') {
                        setCourseFilters({ course: filters.course ?? '', teacher: filters.teacher ?? '', status: filters.status ?? '' })
                        setCurrentPage(1)
                    } else {
                        setPrivateFilters({ teacher: filters.teacher ?? '', plan: filters.plan ?? '', status: filters.status ?? '' })
                        setPrivateCurrentPage(1)
                    }
                }}
                toolbar={{
                    filters: { label: 'Filtros', variant: 'secondary' },
                    create: activeTab === 'groups'
                        ? { label: 'Nuevo', onClick: () => { setCourseForm({ name: '', description: '', status: 'Borrador' }); setIsCreateModalOpen(true) }, variant: 'primary' }
                        : { label: 'Nuevo', onClick: () => setIsPrivateModalOpen(true), variant: 'primary' },
                }}
                postHeaderContent={(
                    <div className="offer-context-header">
                        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'groups' | 'private')}>
                            <TabsList variant="line" aria-label="Secciones de oferta académica">
                                <TabsTrigger value="groups">Cursos</TabsTrigger>
                                <TabsTrigger value="private">Particulares</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <div className="cycle-context-compact">
                            <span className="cycle-context-label">Ciclo lectivo</span>
                            <div className="cycle-context-row">
                                <select aria-label="Ciclo lectivo" value={activeCycleId} disabled={cycles.length === 0} onChange={(event) => activateCycle.mutate(event.target.value, { onError: () => showToast('error', 'No se pudo cambiar el ciclo lectivo activo.') })}>
                                    {cycles.length === 0 && <option value="">Creá un ciclo lectivo</option>}
                                    {cycles.length > 0 && !activeCycleId && <option value="">Seleccioná un ciclo lectivo</option>}
                                    {cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.name}</option>)}
                                </select>
                                <button type="button" className="secondary-button cycle-icon-action" aria-label="Crear nuevo ciclo lectivo" data-tooltip="Crear y configurar un nuevo ciclo lectivo" onClick={() => setIsCreateCycleOpen(true)}><CalendarPlus size={16} /></button>
                            </div>
                        </div>
                    </div>
                )}
            >
                {activeTab === 'groups' && (
                    <DataTable
                        rows={paginatedCourses}
                        getRowKey={(course) => course.id}
                        onRowClick={(course) => navigate(path(`oferta/${course.id}`))}
                        pagination={{
                            currentPage,
                            totalPages,
                            onPageChange: setCurrentPage,
                        }}
                        columns={[
                            {
                                key: 'course',
                                header: 'Oferta académica',
                                accessor: (course) => <EntityCell name={course.name} subtitle={`${course.commissions.length} comisiones`} avatar={course.name.charAt(0)} />,
                            },
                            {
                                key: 'students',
                                header: 'Alumnos',
                                accessor: (course) => <strong>{course.studentsCount}</strong>,
                                align: 'center',
                            },
                            {
                                key: 'status',
                                header: 'Estado',
                                accessor: (course) => <StatusBadge label={course.status} tone={statusToneMap[course.status]} />,
                                align: 'center',
                            },
                        ]}
                        renderActions={(course) => (
                            <RowActionMenu
                                ariaLabel={`Acciones para ${course.name}`}
                                active={openMenuId === course.id}
                                onToggle={() => setOpenMenuId((current) => (current === course.id ? null : course.id))}
                                actions={[
                                    { label: 'Ver oferta académica', icon: <BookOpen size={15} />, onClick: () => navigate(path(`offers/${course.id}`)) },
                                    {
                                        label: 'Editar', icon: <PencilLine size={15} />, onClick: () => {
                                            setEditingCourse(course)
                                            setCourseForm({ name: course.name, description: course.description ?? '', status: course.status })
                                            setIsEditModalOpen(true)
                                        }
                                    },
                                    { label: 'Detalle', icon: <Eye size={15} />, onClick: () => navigate(path(`offers/${course.id}`)) },
                                    { label: 'Eliminar', icon: <Trash2 size={15} />, onClick: () => setDeleteTarget(course), variant: 'danger' },
                                ]}
                            />
                        )}
                        emptyLabel="No se encontraron ofertas académicas con esos filtros."
                    />
                )}

                {activeTab === 'private' && (
                    <PrivateLessonsTable
                        rows={paginatedPrivateStudents}
                        currentPage={privateCurrentPage}
                        totalPages={privateTotalPages}
                        openMenuId={openMenuId}
                        onPageChange={setPrivateCurrentPage}
                        onToggleMenu={(id) => setOpenMenuId((current) => current === id ? null : id)}
                        onView={(item) => navigate(path(`students/${item.studentId}`))}
                        onCollect={() => navigate(path('billing'))}
                        onEdit={(item) => {
                            setPrivateLessonForm({ studentId: item.studentId, teacherId: item.teacherId, purpose: item.purpose, plan: item.plan, startDate: item.startDate, endDate: item.endDate, days: item.days, fromTime: item.fromTime, toTime: item.toTime, costPerClass: String(item.costPerClass) })
                            setEditingPrivateLessonId(item.id)
                            setIsPrivateModalOpen(true)
                        }}
                        onCancel={(item) => updatePrivateLesson.mutate({ id: item.id, changes: { status: 'Finalizada' } }, {
                            onSuccess: () => showToast('success', 'Clase particular cancelada correctamente.'),
                            onError: () => showToast('error', 'No se pudo cancelar la clase particular. Intentá nuevamente.'),
                        })}
                    />
                )}
            </CrudListPage>
        </>
    )
}
