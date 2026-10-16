import { Trash2, BookOpen, CalendarDays, CalendarPlus, PencilLine } from 'lucide-react'
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
import { type AcademicCourse, getActiveAcademicCycleId, getCourseRemovalBlockers, listPendingByPrivateLesson, useCharges, listAcademicCycles, listCourses, listPrivateLessons, listStaff, listStudents, useAcademyRepositoryVersion, useActivateCycle, useDeleteCycle, useDeletePrivateLesson, useUpdateCycle, useCreateCourse, useCreateCycle, useCreatePrivateLesson, useDeleteCourse, useUpdatePrivateLesson } from '@/services/academyRepository'
import { isCycleOverlap, isCycleWithCourses } from '@/services/organization/academicOffersApi'
import { PrivateLessonsTable, type PrivateStudentRow } from '../components/PrivateLessonsTable'
import { splitFilterValue } from '@/components/crud/filterValues'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
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
    // Keeps the charges mirror fresh for the "Pendiente de cobro" of each private lesson.
    useCharges()
    const students = listStudents()
    const requestedStudentId = searchParams.get('student') ?? students[0]?.id ?? ''
    const opensPrivateLesson = searchParams.get('tab') === 'private' && Boolean(searchParams.get('student'))
    const [activeTab, setActiveTab] = useState<'groups' | 'private'>(() => searchParams.get('tab') === 'private' ? 'private' : 'groups')
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [createCourseError, setCreateCourseError] = useState('')
    const [courseForm, setCourseForm] = useState<CourseFormValue>({ name: '', description: '', status: 'Borrador' })
    const [deleteTarget, setDeleteTarget] = useState<Course | null>(null)
    const cycles = listAcademicCycles()
    const activeCycleId = getActiveAcademicCycleId()
    const [isCreateCycleOpen, setIsCreateCycleOpen] = useState(false)
    const [cycleForm, setCycleForm] = useState({ name: '', startDate: '2027-01-01', endDate: '2027-12-31' })
    const [createCycleError, setCreateCycleError] = useState('')
    const createCycle = useCreateCycle()
    const activateCycle = useActivateCycle()
    const updateCycle = useUpdateCycle()
    const deleteCycle = useDeleteCycle()
    // Editing reuses the creation modal; deleting is only for a cycle created by mistake (no offers).
    const [editingCycleId, setEditingCycleId] = useState<string | null>(null)
    const [isDeleteCycleOpen, setIsDeleteCycleOpen] = useState(false)
    const deletePrivateLesson = useDeletePrivateLesson()
    const [cancelLessonTarget, setCancelLessonTarget] = useState<{ id: string; student: string } | null>(null)
    const [deleteLessonTarget, setDeleteLessonTarget] = useState<{ id: string; student: string } | null>(null)
    const createCourse = useCreateCourse()
    const deleteCourse = useDeleteCourse()
    const createPrivateLesson = useCreatePrivateLesson()
    const updatePrivateLesson = useUpdatePrivateLesson()
    const { showToast } = useToast()
    const selectedBranchId = useSelectedBranchId()
    const courseItems = listCourses().filter((course) => course.cycleId === activeCycleId && course.branchId === selectedBranchId)
    const [courseFilters, setCourseFilters] = useState({ course: '', teacher: '', status: '' })
    const [privateFilters, setPrivateFilters] = useState({ teacher: '', plan: '', status: '' })
    const filteredCourseItems = courseItems.filter((course) => {
        const courses = splitFilterValue(courseFilters.course)
        const teachers = splitFilterValue(courseFilters.teacher)
        const statuses = splitFilterValue(courseFilters.status)
        return (courses.length === 0 || courses.includes(course.name))
            && (teachers.length === 0 || course.commissions.some((commission) => commission.teachers.some((teacher) => teachers.includes(teacher))))
            && (statuses.length === 0 || statuses.includes(course.status))
    })
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
    // What each lesson still has to collect, from its real charges (linked by privateLessonId).
    const pendingByLesson = listPendingByPrivateLesson()
    const privateStudentsItems: PrivateStudentRow[] = listPrivateLessons().flatMap((lesson) => {
        const student = studentsById.get(lesson.studentId)
        if (!student) return []

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
            pendingAmount: pendingByLesson.get(lesson.id) ?? 0,
            days: lesson.days,
            fromTime: lesson.fromTime,
            toTime: lesson.toTime,
            status: lesson.status,
        }]
    })
    const filteredPrivateStudentsItems = privateStudentsItems.filter((item) => {
        const teachers = splitFilterValue(privateFilters.teacher)
        const plans = splitFilterValue(privateFilters.plan)
        const statuses = splitFilterValue(privateFilters.status)
        return (teachers.length === 0 || teachers.includes(item.teacher))
            && (plans.length === 0 || plans.includes(item.plan))
            && (statuses.length === 0 || statuses.includes(item.status))
    })

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
                onSuccess: () => showToast('success', 'Clase particular creada correctamente. Sus cobros ya están en Cobranzas.'),
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
                title={editingCycleId ? 'Editar ciclo lectivo' : 'Nuevo ciclo lectivo'}
                subtitle={editingCycleId ? 'Cambiá el nombre o las fechas del período.' : 'Creá el período que organizará la oferta, las comisiones y sus inscripciones.'}
                submitLabel={editingCycleId ? 'Guardar cambios' : 'Crear ciclo'}
                validate={() => validateConditions({ cycleName: !cycleForm.name.trim() && 'Ingresá el nombre.', cycleStartDate: !cycleForm.startDate && 'Ingresá el inicio.', cycleEndDate: (!cycleForm.endDate || cycleForm.endDate < cycleForm.startDate) && 'Ingresá una fecha de fin válida.' }, 'Revisá los datos del ciclo.')}
                onClose={() => { setIsCreateCycleOpen(false); setEditingCycleId(null); setCreateCycleError('') }}
                onSubmit={async () => {
                    setCreateCycleError('')
                    if (editingCycleId) {
                        try {
                            await updateCycle.mutateAsync({ id: editingCycleId, changes: { name: cycleForm.name.trim(), startDate: cycleForm.startDate, endDate: cycleForm.endDate } })
                        } catch (error) {
                            setCreateCycleError(isCycleOverlap(error) ? 'Las fechas se solapan con otro ciclo lectivo que no está cerrado. Ajustá el rango.' : 'No se pudo guardar el ciclo lectivo. Intentá nuevamente.')
                            throw error
                        }
                        showToast('success', 'Ciclo lectivo actualizado.')
                        setIsCreateCycleOpen(false)
                        setEditingCycleId(null)
                        return
                    }
                    createCycle.mutate({ ...cycleForm, name: cycleForm.name.trim(), status: 'Borrador' }, {
                        onSuccess: (created) => {
                            setIsCreateCycleOpen(false)
                            activateCycle.mutate(created.id, {
                                onSuccess: () => showToast('success', 'Ciclo lectivo creado y activado correctamente.'),
                                onError: () => showToast('error', 'El ciclo se creó, pero no se pudo activar automáticamente. Activalo desde el selector de ciclo lectivo.'),
                            })
                        },
                        onError: (error) => setCreateCycleError(isCycleOverlap(error) ? 'Las fechas se solapan con otro ciclo lectivo que no está cerrado. Ajustá el rango o cerrá el ciclo anterior.' : 'No se pudo crear el ciclo lectivo. Intentá nuevamente.'),
                    })
                }}
            >
                <div className="form-grid">
                    <label className="form-field"><span className="form-field-label"><span>Nombre <b className="form-required-mark">*</b></span></span><input name="cycleName" className="form-input" value={cycleForm.name} onChange={(event) => { setCycleForm((current) => ({ ...current, name: event.target.value })); setCreateCycleError('') }} placeholder="Ej: Ciclo lectivo 2027" /></label>
                    <label className="form-field"><span className="form-field-label"><span>Fecha de inicio <b className="form-required-mark">*</b></span></span><input name="cycleStartDate" className="form-input" type="date" value={cycleForm.startDate} onChange={(event) => { setCycleForm((current) => ({ ...current, startDate: event.target.value })); setCreateCycleError('') }} /></label>
                    <label className="form-field"><span className="form-field-label"><span>Fecha de cierre <b className="form-required-mark">*</b></span></span><input name="cycleEndDate" className="form-input" type="date" value={cycleForm.endDate} onChange={(event) => { setCycleForm((current) => ({ ...current, endDate: event.target.value })); setCreateCycleError('') }} /></label>
                </div>
                {createCycleError && <p className="form-error-message" role="alert">{createCycleError}</p>}
                {editingCycleId && <div className="cycle-danger-zone"><span>¿Lo creaste por error? Solo se puede eliminar si no tiene ofertas académicas.</span><button type="button" className="secondary-button compact-button danger-button" onClick={() => setIsDeleteCycleOpen(true)}><Trash2 size={15} />Eliminar ciclo</button></div>}
            </EntityFormModal>

            <DeleteConfirmationModal
                open={isDeleteCycleOpen}
                title="Eliminar ciclo lectivo"
                description={`Se elimina el ciclo "${cycleForm.name}". Si era el ciclo activo, vas a tener que activar otro para seguir cargando ofertas.`}
                confirmErrorMessage="No se pudo eliminar el ciclo lectivo. Intentá nuevamente."
                onClose={() => setIsDeleteCycleOpen(false)}
                onConfirm={async () => {
                    if (!editingCycleId) return
                    try {
                        await deleteCycle.mutateAsync(editingCycleId)
                    } catch (error) {
                        if (isCycleWithCourses(error)) {
                            setIsDeleteCycleOpen(false)
                            setCreateCycleError('No se puede eliminar: el ciclo tiene ofertas académicas. Eliminalas primero o dejá el ciclo como está.')
                            return
                        }
                        throw error
                    }
                    showToast('success', 'Ciclo lectivo eliminado.')
                    setIsDeleteCycleOpen(false)
                    setIsCreateCycleOpen(false)
                    setEditingCycleId(null)
                }}
            />

            <DeleteConfirmationModal
                open={Boolean(cancelLessonTarget)}
                title="Cancelar clase particular"
                description={`La clase de ${cancelLessonTarget?.student ?? 'este alumno'} queda finalizada y se eliminan sus cobros sin pagar que vencen después de hoy. Los vencidos y los pagados se conservan.`}
                confirmLabel="Cancelar clase"
                cancelLabel="Volver"
                confirmErrorMessage="No se pudo cancelar la clase particular. Intentá nuevamente."
                onClose={() => setCancelLessonTarget(null)}
                onConfirm={async () => {
                    if (!cancelLessonTarget) return
                    await updatePrivateLesson.mutateAsync({ id: cancelLessonTarget.id, changes: { status: 'Finalizada' } })
                    showToast('success', 'Clase particular cancelada.')
                    setCancelLessonTarget(null)
                }}
            />

            <DeleteConfirmationModal
                open={Boolean(deleteLessonTarget)}
                title="Eliminar clase particular"
                description={`Usalo si la cargaste por error: se borran la clase de ${deleteLessonTarget?.student ?? 'este alumno'} y todos sus cobros sin pagar. Si ya pagó alguno, cancelala en su lugar.`}
                confirmErrorMessage="No se pudo eliminar: si el alumno ya pagó algún cobro de esta clase, cancelala en su lugar."
                onClose={() => setDeleteLessonTarget(null)}
                onConfirm={async () => {
                    if (!deleteLessonTarget) return
                    await deletePrivateLesson.mutateAsync(deleteLessonTarget.id)
                    showToast('success', 'Clase particular eliminada.')
                    setDeleteLessonTarget(null)
                }}
            />

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
                subtitle={editingPrivateLessonId ? 'Si cambiás el plan, el precio o los días, se recalculan los cobros sin pagar que vencen después de hoy.' : 'Seleccioná un alumno y completá los datos de la clase particular.'}
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

            {cycles.length === 0 && (
                <div className="inline-warning-banner" role="status">
                    <CalendarDays size={16} />
                    <span>Todavía no creaste ningún ciclo lectivo — es la base de la oferta académica (cursos, comisiones, inscripciones). Creá el primero para empezar a cargar datos.</span>
                    <button type="button" className="primary-button compact-button" onClick={() => setIsCreateCycleOpen(true)}>Crear ciclo lectivo</button>
                </div>
            )}

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
                                <SearchableSelect
                                    aria-label="Ciclo lectivo"
                                    value={activeCycleId}
                                    disabled={cycles.length === 0}
                                    placeholder={cycles.length === 0 ? 'Creá un ciclo lectivo' : 'Seleccioná un ciclo lectivo'}
                                    options={cycles.map((cycle) => ({ value: cycle.id, label: cycle.name }))}
                                    onChange={(cycleId) => activateCycle.mutate(cycleId, { onError: () => showToast('error', 'No se pudo cambiar el ciclo lectivo activo.') })}
                                />
                                <button type="button" className="secondary-button cycle-icon-action" aria-label="Editar ciclo lectivo" data-tooltip="Editar el ciclo lectivo seleccionado" disabled={!activeCycleId} onClick={() => {
                                    const cycle = cycles.find((item) => item.id === activeCycleId)
                                    if (!cycle) return
                                    setEditingCycleId(cycle.id)
                                    setCycleForm({ name: cycle.name, startDate: cycle.startDate, endDate: cycle.endDate })
                                    setCreateCycleError('')
                                    setIsCreateCycleOpen(true)
                                }}><PencilLine size={16} /></button>
                                <button type="button" className="secondary-button cycle-icon-action" aria-label="Crear nuevo ciclo lectivo" data-tooltip="Crear y configurar un nuevo ciclo lectivo" onClick={() => { setEditingCycleId(null); setCycleForm({ name: '', startDate: '2027-01-01', endDate: '2027-12-31' }); setIsCreateCycleOpen(true) }}><CalendarPlus size={16} /></button>
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
                                accessor: (course) => <EntityCell name={course.name} avatar={course.name.charAt(0)} />,
                            },
                            {
                                key: 'description',
                                header: 'Descripción',
                                accessor: (course) => course.description ? <span className="table-description" title={course.description}>{course.description}</span> : <span className="table-secondary-text">Sin descripción</span>,
                            },
                            {
                                key: 'commissions',
                                header: 'Comisiones',
                                accessor: (course) => <strong>{course.commissions.length}</strong>,
                                align: 'center',
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
                        onCancel={(item) => setCancelLessonTarget({ id: item.id, student: item.student })}
                        onDelete={(item) => setDeleteLessonTarget({ id: item.id, student: item.student })}
                    />
                )}
            </CrudListPage>
        </>
    )
}
