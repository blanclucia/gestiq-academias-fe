import { Eye, PencilLine, Trash2, BookOpen, CalendarPlus, Copy } from 'lucide-react'
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
import { type AcademicCourse, createAcademicCycle, createCourse, createPrivateLesson, getActiveAcademicCycleId, getCourseRemovalBlockers, listAcademicCycles, listCourses, listPrivateLessons, listStudents, removeCourse, replicateAcademicOffer, setActiveAcademicCycle, updateCourse, updatePrivateLesson, useAcademyRepositoryVersion } from '@/services/academyRepository'
import { PrivateLessonsTable, type PrivateStudentRow } from '../components/PrivateLessonsTable'
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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingCourse, setEditingCourse] = useState<Course | null>(null)
    const [courseForm, setCourseForm] = useState<CourseFormValue>({ name: '', duration: '', description: '', status: 'Borrador' })
    const [deleteTarget, setDeleteTarget] = useState<Course | null>(null)
    const cycles = listAcademicCycles()
    const activeCycleId = getActiveAcademicCycleId()
    const activeCycle = cycles.find((cycle) => cycle.id === activeCycleId)
    const [isCreateCycleOpen, setIsCreateCycleOpen] = useState(false)
    const [isReplicateCycleOpen, setIsReplicateCycleOpen] = useState(false)
    const [replicateAfterCreate, setReplicateAfterCreate] = useState(false)
    const [cycleForm, setCycleForm] = useState({ name: '', startDate: '2027-01-01', endDate: '2027-12-31' })
    const [replicateSourceCycleId, setReplicateSourceCycleId] = useState(activeCycleId)
    const [includeCommissions, setIncludeCommissions] = useState(true)
    const courseItems = listCourses().filter((course) => course.cycleId === activeCycleId)
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
        teacher: '',
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
    const privateStudentsItems: PrivateStudentRow[] = listPrivateLessons().flatMap((lesson) => {
        const student = studentsById.get(lesson.studentId)
        if (!student) return []
        const balance = lesson.plan === 'Pack 4 clases' ? 4 : lesson.plan === 'Pack 8 clases' ? 8 : lesson.plan === 'Pack 12 clases' ? 12 : 1

        return [{
            id: lesson.id,
            studentId: lesson.studentId,
            student: student.fullName,
            teacher: lesson.teacher,
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
            teacher: privateLessonForm.teacher,
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
            updatePrivateLesson(editingPrivateLessonId, { ...lessonData, status: 'Activa' })
        } else {
            createPrivateLesson(lessonData)
        }

        setPrivateLessonForm({
            studentId: students[0]?.id ?? '',
            teacher: '',
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
                subtitle={replicateAfterCreate ? `Creá el ciclo de destino. La oferta de ${activeCycle?.name ?? 'este ciclo'} se copiará automáticamente.` : 'Creá el período que organizará la oferta, las comisiones y sus inscripciones.'}
                submitLabel={replicateAfterCreate ? 'Crear y replicar' : 'Crear ciclo'}
                validate={() => validateConditions({ cycleName: !cycleForm.name.trim() && 'Ingresá el nombre.', cycleStartDate: !cycleForm.startDate && 'Ingresá el inicio.', cycleEndDate: (!cycleForm.endDate || cycleForm.endDate < cycleForm.startDate) && 'Ingresá una fecha de fin válida.' }, 'Revisá los datos del ciclo.')}
                onClose={() => { setIsCreateCycleOpen(false); setReplicateAfterCreate(false) }}
                onSubmit={() => {
                    const sourceCycleId = activeCycleId
                    const nextCycle = createAcademicCycle({ ...cycleForm, name: cycleForm.name.trim(), status: 'Borrador' })
                    if (replicateAfterCreate) replicateAcademicOffer(sourceCycleId, nextCycle.id, true)
                    setIsCreateCycleOpen(false)
                    setReplicateAfterCreate(false)
                }}
            >
                <div className="form-grid">
                    <label className="form-field"><span className="form-field-label">Nombre <b className="form-required-mark">*</b></span><input className="form-input" value={cycleForm.name} onChange={(event) => setCycleForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ej: Ciclo lectivo 2027" /></label>
                    <label className="form-field"><span className="form-field-label">Fecha de inicio <b className="form-required-mark">*</b></span><input className="form-input" type="date" value={cycleForm.startDate} onChange={(event) => setCycleForm((current) => ({ ...current, startDate: event.target.value }))} /></label>
                    <label className="form-field"><span className="form-field-label">Fecha de cierre <b className="form-required-mark">*</b></span><input className="form-input" type="date" value={cycleForm.endDate} onChange={(event) => setCycleForm((current) => ({ ...current, endDate: event.target.value }))} /></label>
                </div>
            </EntityFormModal>

            <EntityFormModal
                open={isReplicateCycleOpen}
                title="Replicar oferta académica"
                subtitle={`Copiá la estructura de otro ciclo hacia ${activeCycle?.name ?? 'el ciclo actual'}, sin alumnos, pagos, asistencias ni inscripciones.`}
                submitLabel="Replicar oferta"
                validate={() => validateConditions({ replicateCycle: (!replicateSourceCycleId || replicateSourceCycleId === activeCycleId) && 'Seleccioná un ciclo de origen diferente.' })}
                onClose={() => setIsReplicateCycleOpen(false)}
                onSubmit={() => {
                    if (replicateSourceCycleId && replicateSourceCycleId !== activeCycleId) replicateAcademicOffer(replicateSourceCycleId, activeCycleId, includeCommissions)
                    setIsReplicateCycleOpen(false)
                }}
            >
                <div className="form-grid">
                    <label className="form-field"><span className="form-field-label">Ciclo de origen</span><select className="form-input" value={replicateSourceCycleId} onChange={(event) => setReplicateSourceCycleId(event.target.value)}><option value="">Seleccionar ciclo</option>{cycles.filter((cycle) => cycle.id !== activeCycleId).map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.name}</option>)}</select></label>
                    <label className="form-checkbox-row"><input type="checkbox" checked={includeCommissions} onChange={(event) => setIncludeCommissions(event.target.checked)} /><span>Copiar también las comisiones, docentes, horarios y valores</span></label>
                </div>
            </EntityFormModal>

            <EntityFormModal
                open={isCreateModalOpen}
                title="Nueva oferta académica"
                subtitle="Completa los datos principales de la oferta académica."
                validate={() => validateConditions({ courseName: !courseForm.name.trim() && 'Ingresá el nombre de la oferta.' })}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={() => { if (courseForm.name.trim()) createCourse({ ...courseForm, name: courseForm.name.trim() }); setIsCreateModalOpen(false) }}
            >
                <CourseForm value={courseForm} onValueChange={setCourseForm} />
            </EntityFormModal>

            <EntityFormModal
                open={isEditModalOpen}
                title="Editar oferta académica"
                subtitle="Actualiza los datos principales de la oferta académica."
                validate={() => validateConditions({ courseName: !courseForm.name.trim() && 'Ingresá el nombre de la oferta.' })}
                onClose={() => {
                    setIsEditModalOpen(false)
                    setEditingCourse(null)
                }}
                onSubmit={() => {
                    if (editingCourse && courseForm.name.trim()) updateCourse(editingCourse.id, { ...courseForm, name: courseForm.name.trim() })
                    setIsEditModalOpen(false)
                    setEditingCourse(null)
                }}
            >
                <CourseForm
                    value={courseForm}
                    onValueChange={setCourseForm}
                    initialValues={{
                        name: editingCourse?.name,
                        duration: '12 semanas',
                        description: 'Oferta académica orientada a nivel inicial con foco en speaking y listening.',
                    }}
                />
            </EntityFormModal>

            <DeleteConfirmationModal
                open={Boolean(deleteTarget)}
                title="Eliminar oferta académica"
                description={removalBlockers.length > 0 ? `No se puede eliminar "${deleteTarget?.name}" porque tiene ${removalBlockers.join(', ')}. Cerrá o resolvé estos vínculos antes de eliminarla.` : `¿Estás seguro que querés eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
                confirmLabel={removalBlockers.length > 0 ? 'Entendido' : undefined}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => {
                    if (deleteTarget && removalBlockers.length === 0) {
                        removeCourse(deleteTarget.id)
                    }
                    setDeleteTarget(null)
                }}
            />

            <EntityFormModal
                open={isPrivateModalOpen}
                title={editingPrivateLessonId ? 'Reprogramar clase particular' : 'Nuevo particular'}
                subtitle={editingPrivateLessonId ? 'Actualizá la agenda o las condiciones de la clase.' : 'Seleccioná un alumno y completá los datos de la clase particular.'}
                submitLabel={editingPrivateLessonId ? 'Guardar cambios' : 'Crear particular'}
                validate={() => validateConditions({ privateStudent: !students.some((student) => student.id === privateLessonForm.studentId) && 'Seleccioná un alumno.', privateTeacher: !privateLessonForm.teacher && 'Seleccioná un docente.', privatePurpose: !privateLessonForm.purpose.trim() && 'Ingresá el motivo.', privateCost: Number(privateLessonForm.costPerClass) <= 0 && 'Ingresá un costo válido.', privateStart: !privateLessonForm.startDate && 'Ingresá el inicio.', privateEnd: (!privateLessonForm.endDate || privateLessonForm.endDate < privateLessonForm.startDate) && 'Ingresá una fecha de fin válida.', privateDays: privateLessonForm.days.length === 0 && 'Seleccioná al menos un día.', privateTime: (!privateLessonForm.fromTime || !privateLessonForm.toTime || privateLessonForm.toTime <= privateLessonForm.fromTime) && 'Ingresá un horario válido.' }, 'Revisá los datos de la clase particular.')}
                onClose={() => {
                    setEditingPrivateLessonId(null)
                    setIsPrivateModalOpen(false)
                }}
                onSubmit={submitPrivateLesson}
            >
                <PrivateLessonForm value={privateLessonForm} onChange={setPrivateLessonForm} studentOptions={privateStudentOptions} />
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
                        ? { label: 'Nuevo', onClick: () => { setCourseForm({ name: '', duration: '', description: '', status: 'Borrador' }); setIsCreateModalOpen(true) }, variant: 'primary' }
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
                            <label>
                                <select aria-label="Ciclo lectivo" value={activeCycleId} onChange={(event) => setActiveAcademicCycle(event.target.value)}>
                                    {cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.name}</option>)}
                                </select>
                            </label>
                            <button type="button" className="secondary-button cycle-icon-action" aria-label="Replicar oferta de otro ciclo" data-tooltip={cycles.length < 2 ? 'Crear un nuevo ciclo copiando la oferta actual' : 'Copiar cursos y comisiones desde otro ciclo lectivo'} onClick={() => {
                                if (cycles.length < 2) {
                                    setReplicateAfterCreate(true)
                                    setIsCreateCycleOpen(true)
                                    return
                                }
                                setReplicateSourceCycleId(cycles.find((cycle) => cycle.id !== activeCycleId)?.id ?? '')
                                setIsReplicateCycleOpen(true)
                            }}><Copy size={16} /></button>
                            <button type="button" className="secondary-button cycle-icon-action" aria-label="Crear nuevo ciclo lectivo" data-tooltip="Crear y configurar un nuevo ciclo lectivo" onClick={() => { setReplicateAfterCreate(false); setIsCreateCycleOpen(true) }}><CalendarPlus size={16} /></button>
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
                                            setCourseForm({ name: course.name, duration: course.duration ?? '', description: course.description ?? '', status: course.status })
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
                            setPrivateLessonForm({ studentId: item.studentId, teacher: item.teacher, purpose: item.purpose, plan: item.plan, startDate: item.startDate, endDate: item.endDate, days: item.days, fromTime: item.fromTime, toTime: item.toTime, costPerClass: String(item.costPerClass) })
                            setEditingPrivateLessonId(item.id)
                            setIsPrivateModalOpen(true)
                        }}
                        onCancel={(item) => updatePrivateLesson(item.id, { status: 'Finalizada' })}
                    />
                )}
            </CrudListPage>
        </>
    )
}
