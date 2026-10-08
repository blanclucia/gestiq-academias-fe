import { PencilLine, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { CrudListPage } from '@/components/crud/CrudListPage'
import { DeleteConfirmationModal, EntityFormModal, FormField, FormGrid, FormSection } from '@/components/crud/EntityFormModal'
import { useCrudList } from '@/hooks/useCrudList'
import { MetaCell } from '@/components/ui/ContactCell'
import { DataTable } from '@/components/ui/DataTable'
import { RowActionMenu } from '@/components/ui/RowActionMenu'
import { StatusBadge, type StatusBadgeTone } from '@/components/ui/StatusBadge'
import type { Teacher } from '@/data/teachers'
import { listStaff, useAcademyRepositoryVersion, useCreateStaffMember, useDeleteStaffMember, useUpdateStaffMember } from '@/services/academyRepository'
import { isMemberConflict } from '@/services/organization/membersApi'
import { validateConditions } from '@/components/forms/formValidation'
import { splitFilterValue } from '@/components/crud/filterValues'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useToast } from '@/components/ui/ToastContext'

type StaffPageProps = {
    compact?: boolean
    contentInset?: boolean
    title?: string
    description?: string
    administratorIds?: string[]
    onToggleAdministrator?: (staffId: string, enabled: boolean) => void
    staffIds?: string[]
    onStaffCreated?: (staffId: string) => void
}

const statusToneMap: Record<Teacher['status'], StatusBadgeTone> = {
    Activo: 'success',
    Inactivo: 'neutral',
}

const emptyTeacherForm = {
    firstName: '',
    lastName: '',
    fullName: '',
    email: '',
    phone: '',
    specialty: '',
    dni: '',
    role: 'Docente' as Teacher['role'],
    status: 'Activo' as Teacher['status'],
}

const dniPattern = /^[0-9]{7,8}$/
// Allows digits, spaces and the usual phone punctuation, but still rejects free-text typos —
// the minimum digit count (not just pattern) catches something like "N/A" slipping through.
const phonePattern = /^[0-9+()\s-]{6,20}$/
const isValidPhone = (value: string) => value.trim() === '' || (phonePattern.test(value.trim()) && (value.match(/\d/g) ?? []).length >= 6)

export function StaffPage({
    compact = false,
    contentInset,
    title = 'Profesores',
    description = 'Administración de docentes y asignaturas activas.',
    administratorIds,
    onToggleAdministrator,
    staffIds,
    onStaffCreated,
}: StaffPageProps = {}) {
    useAcademyRepositoryVersion()
    const { showToast } = useToast()
    const createStaffMember = useCreateStaffMember()
    const updateStaffMember = useUpdateStaffMember()
    const deleteStaffMember = useDeleteStaffMember()
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newTeacher, setNewTeacher] = useState(emptyTeacherForm)
    const [newIsAdministrator, setNewIsAdministrator] = useState(false)
    const [createError, setCreateError] = useState('')
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
    const [editingTeacherForm, setEditingTeacherForm] = useState(emptyTeacherForm)
    const [editingIsAdministrator, setEditingIsAdministrator] = useState(false)
    // Captured when the edit modal opens, so onSubmit can tell "admin checkbox actually changed"
    // apart from "it was already this way" — otherwise every edit re-fires the toggle (and its
    // toast) even when nothing about the admin status changed.
    const [editingInitialIsAdministrator, setEditingInitialIsAdministrator] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null)
    const teacherList = listStaff().filter((member) => !staffIds || staffIds.includes(member.id))
    const [activeFilters, setActiveFilters] = useState({ specialty: '', role: '', status: '' })
    const matchesRole = (teacher: Teacher, role: string) =>
        role === 'Profesor' ? teacher.role === 'Docente' : role === 'Administrador' ? Boolean(administratorIds?.includes(teacher.id)) : teacher.role === role
    const filteredTeacherList = teacherList.filter((teacher) => {
        const specialties = splitFilterValue(activeFilters.specialty)
        const roles = splitFilterValue(activeFilters.role)
        const statuses = splitFilterValue(activeFilters.status)
        return (specialties.length === 0 || specialties.includes(teacher.specialty))
            && (roles.length === 0 || roles.some((role) => matchesRole(teacher, role)))
            && (statuses.length === 0 || statuses.includes(teacher.status))
    })

    const {
        search,
        setSearch,
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedItems: paginatedTeachers,
    } = useCrudList<Teacher>({
        items: filteredTeacherList,
        pageSize: 10,
        searchFields: [
            (teacher) => `${teacher.fullName} ${teacher.email}`,
            (teacher) => teacher.specialty,
        ],
    })

    return (
        <>
            <EntityFormModal
                open={isCreateModalOpen}
                title="Nuevo integrante del staff"
                subtitle="Completá los datos para incorporarlo a esta sede."
                submitLabel="Agregar al staff"
                validate={() => validateConditions({ teacherFirstName: !newTeacher.firstName.trim() && 'Ingresá el nombre.', teacherLastName: !newTeacher.lastName.trim() && 'Ingresá el apellido.', teacherEmail: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newTeacher.email) && 'Ingresá un email válido.', teacherDni: !dniPattern.test(newTeacher.dni.trim()) && 'Ingresá un DNI válido (7 u 8 dígitos, sin puntos).', teacherPhone: !isValidPhone(newTeacher.phone) && 'Ingresá un teléfono válido (solo números, espacios, +, - o paréntesis).', teacherRole: newTeacher.role !== 'Docente' && !newIsAdministrator && 'Asigná permisos de administración.' }, 'Revisá los datos del integrante.')}
                onClose={() => {
                    setIsCreateModalOpen(false)
                    setNewTeacher(emptyTeacherForm)
                    setNewIsAdministrator(false)
                    setCreateError('')
                }}
                onSubmit={() => {
                    if (!newTeacher.firstName.trim() || !newTeacher.lastName.trim() || !newTeacher.email.trim() || !dniPattern.test(newTeacher.dni.trim())) {
                        setCreateError('Completá nombre, apellido, email y un DNI válido.')
                        return
                    }
                    if (newTeacher.role !== 'Docente' && !newIsAdministrator) {
                        setCreateError('Seleccioná al menos un rol.')
                        return
                    }
                    setCreateError('')
                    createStaffMember.mutate({ ...newTeacher, fullName: `${newTeacher.firstName.trim()} ${newTeacher.lastName.trim()}`, email: newTeacher.email.trim(), phone: newTeacher.phone.trim(), specialty: newTeacher.specialty.trim(), dni: newTeacher.dni.trim(), isAdministrator: newIsAdministrator }, {
                        onSuccess: (created) => {
                            onStaffCreated?.(created.id)
                            if (newIsAdministrator) onToggleAdministrator?.(created.id, true)
                            setIsCreateModalOpen(false)
                            setNewTeacher(emptyTeacherForm)
                            setNewIsAdministrator(false)
                            setCreateError('')
                        },
                        onError: (error) => setCreateError(isMemberConflict(error) ? 'Ya existe un miembro con ese DNI en esta organización.' : 'No se pudo crear el integrante. Intentá nuevamente.'),
                    })
                }}
            >
                <div className="form-stack">
                    <FormSection title="Datos del integrante">
                        <FormGrid>
                            <FormField label="Nombre" required>
                                <input name="teacherFirstName" className="form-input" type="text" value={newTeacher.firstName} onChange={(event) => setNewTeacher((current) => ({ ...current, firstName: event.target.value }))} />
                            </FormField>
                            <FormField label="Apellido" required>
                                <input name="teacherLastName" className="form-input" type="text" value={newTeacher.lastName} onChange={(event) => setNewTeacher((current) => ({ ...current, lastName: event.target.value }))} />
                            </FormField>
                            <FormField label="Email" required hint="Se va a crear un usuario del sistema para esta persona con estos datos — completalo con cuidado.">
                                <input name="teacherEmail" className="form-input" type="email" value={newTeacher.email} onChange={(event) => setNewTeacher((current) => ({ ...current, email: event.target.value }))} />
                            </FormField>
                            <FormField label="DNI" required hint="Sin puntos ni espacios. Se usa para crear su usuario y, si corresponde, para asignarla como administradora.">
                                <input name="teacherDni" className="form-input" type="text" inputMode="numeric" value={newTeacher.dni} onChange={(event) => setNewTeacher((current) => ({ ...current, dni: event.target.value.replace(/\D/g, '').slice(0, 8) }))} />
                            </FormField>
                            <FormField label="Teléfono">
                                <input name="teacherPhone" className="form-input" type="tel" value={newTeacher.phone} onChange={(event) => setNewTeacher((current) => ({ ...current, phone: event.target.value }))} />
                            </FormField>
                            <FormField label="Especialidad o área">
                                <input className="form-input" type="text" value={newTeacher.specialty} onChange={(event) => setNewTeacher((current) => ({ ...current, specialty: event.target.value }))} placeholder="Ej. Inglés, Administración" />
                            </FormField>
                            <FormField label="Roles">
                                <div className="staff-role-picker"><label><input type="checkbox" checked={newTeacher.role === 'Docente'} onChange={(event) => { setNewTeacher((current) => ({ ...current, role: event.target.checked ? 'Docente' : 'Administrativo' })); if (!event.target.checked) setNewIsAdministrator(true) }} />Profesor</label>{onToggleAdministrator && <label><input type="checkbox" checked={newIsAdministrator} onChange={(event) => { setNewIsAdministrator(event.target.checked); if (!event.target.checked && newTeacher.role !== 'Docente') setNewTeacher((current) => ({ ...current, role: 'Docente' })) }} />Administrador</label>}</div>
                            </FormField>
                            <FormField label="Estado">
                                <SearchableSelect value={newTeacher.status} onChange={(status) => setNewTeacher((current) => ({ ...current, status: status as Teacher['status'] }))} options={[{ value: 'Activo', label: 'Activo' }, { value: 'Inactivo', label: 'Inactivo' }]} />
                            </FormField>
                        </FormGrid>
                        {createError && <p style={{ margin: 0, color: 'var(--red)', fontSize: 13 }}>{createError}</p>}
                    </FormSection>
                </div>
            </EntityFormModal>

            <EntityFormModal
                open={isEditModalOpen}
                title="Editar docente"
                subtitle="Actualiza la información del docente."
                validate={() => validateConditions({ teacherFirstName: !editingTeacherForm.firstName.trim() && 'Ingresá el nombre.', teacherLastName: !editingTeacherForm.lastName.trim() && 'Ingresá el apellido.', teacherEmail: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingTeacherForm.email) && 'Ingresá un email válido.', teacherDni: editingIsAdministrator && !editingTeacher?.userId && !dniPattern.test(editingTeacherForm.dni.trim()) && 'Para asignarla como administradora, ingresá un DNI válido (7 u 8 dígitos).', teacherPhone: !isValidPhone(editingTeacherForm.phone) && 'Ingresá un teléfono válido (solo números, espacios, +, - o paréntesis).', teacherRole: editingTeacherForm.role !== 'Docente' && !editingIsAdministrator && 'Asigná permisos de administración.' }, 'Revisá los datos del integrante.')}
                onClose={() => {
                    setIsEditModalOpen(false)
                    setEditingTeacher(null)
                    setEditingTeacherForm(emptyTeacherForm)
                    setEditingIsAdministrator(false)
                }}
                onSubmit={() => {
                    if (!editingTeacher) { setIsEditModalOpen(false); return }
                    const id = editingTeacher.id
                    updateStaffMember.mutate({
                        id,
                        changes: {
                            ...editingTeacherForm,
                            fullName: `${editingTeacherForm.firstName.trim()} ${editingTeacherForm.lastName.trim()}`,
                            email: editingTeacherForm.email.trim(),
                            phone: editingTeacherForm.phone.trim(),
                            specialty: editingTeacherForm.specialty.trim(),
                            dni: editingTeacherForm.dni.trim() || undefined,
                        },
                        isAdministrator: editingIsAdministrator,
                    }, {
                        onSuccess: () => {
                            // Only re-fire the admin grant/revoke (and its own toast) when the
                            // checkbox actually changed — otherwise an unrelated edit (e.g. phone)
                            // on a non-admin would spuriously call "revoke administrator".
                            if (editingIsAdministrator !== editingInitialIsAdministrator) onToggleAdministrator?.(id, editingIsAdministrator)
                            else showToast('success', 'Cambios guardados correctamente.')
                        },
                        onError: (error) => showToast('error', isMemberConflict(error) ? 'Ya existe un miembro con ese DNI en esta organización.' : 'No se pudieron guardar los cambios. Intentá nuevamente.'),
                    })
                    setIsEditModalOpen(false)
                    setEditingTeacher(null)
                    setEditingTeacherForm(emptyTeacherForm)
                    setEditingIsAdministrator(false)
                }}
            >
                <div className="form-stack">
                    <FormSection title="Datos personales">
                        <FormGrid>
                            <FormField label="Nombre" required>
                                <input name="teacherFirstName" className="form-input" type="text" value={editingTeacherForm.firstName} onChange={(event) => setEditingTeacherForm((current) => ({ ...current, firstName: event.target.value }))} />
                            </FormField>
                            <FormField label="Apellido" required>
                                <input name="teacherLastName" className="form-input" type="text" value={editingTeacherForm.lastName} onChange={(event) => setEditingTeacherForm((current) => ({ ...current, lastName: event.target.value }))} />
                            </FormField>
                            <FormField label="Email" required>
                                <input name="teacherEmail" className="form-input" type="email" value={editingTeacherForm.email} onChange={(event) => setEditingTeacherForm((current) => ({ ...current, email: event.target.value }))} />
                            </FormField>
                            <FormField label="DNI" hint={editingTeacher?.userId ? 'Ya tiene un usuario del sistema vinculado.' : 'Sin puntos ni espacios. Hace falta para asignarla como administradora.'}>
                                <input name="teacherDni" className="form-input" type="text" inputMode="numeric" value={editingTeacherForm.dni} onChange={(event) => setEditingTeacherForm((current) => ({ ...current, dni: event.target.value.replace(/\D/g, '').slice(0, 8) }))} />
                            </FormField>
                            <FormField label="Teléfono">
                                <input name="teacherPhone" className="form-input" type="tel" value={editingTeacherForm.phone} onChange={(event) => setEditingTeacherForm((current) => ({ ...current, phone: event.target.value }))} />
                            </FormField>
                            <FormField label="Especialidad">
                                <input className="form-input" type="text" value={editingTeacherForm.specialty} onChange={(event) => setEditingTeacherForm((current) => ({ ...current, specialty: event.target.value }))} />
                            </FormField>
                            <FormField label="Roles">
                                <div className="staff-role-picker"><label><input type="checkbox" checked={editingTeacherForm.role === 'Docente'} onChange={(event) => { setEditingTeacherForm((current) => ({ ...current, role: event.target.checked ? 'Docente' : 'Administrativo' })); if (!event.target.checked) setEditingIsAdministrator(true) }} />Profesor</label>{onToggleAdministrator && <label><input type="checkbox" checked={editingIsAdministrator} onChange={(event) => { setEditingIsAdministrator(event.target.checked); if (!event.target.checked && editingTeacherForm.role !== 'Docente') setEditingTeacherForm((current) => ({ ...current, role: 'Docente' })) }} />Administrador</label>}</div>
                            </FormField>
                            <FormField label="Estado">
                                <SearchableSelect value={editingTeacherForm.status} onChange={(status) => setEditingTeacherForm((current) => ({ ...current, status: status as Teacher['status'] }))} options={[{ value: 'Activo', label: 'Activo' }, { value: 'Inactivo', label: 'Inactivo' }]} />
                            </FormField>
                        </FormGrid>
                    </FormSection>
                </div>
            </EntityFormModal>

            <DeleteConfirmationModal
                open={Boolean(deleteTarget)}
                title="Eliminar docente"
                description={`¿Estás seguro que querés eliminar a "${deleteTarget?.fullName}"? Esta acción no se puede deshacer.`}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => {
                    if (deleteTarget) {
                        deleteStaffMember.mutate(deleteTarget.id, {
                            onSuccess: () => showToast('success', 'Integrante eliminado correctamente.'),
                            onError: () => showToast('error', 'No se pudo eliminar al integrante. Intentá nuevamente.'),
                        })
                    }
                    setDeleteTarget(null)
                }}
            />

            <CrudListPage
                contentInset={contentInset ?? !compact}
                title={title}
                description={compact ? undefined : description}
                compactHeader={compact}
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar profesor o especialidad"
                filterFields={[
                    { key: 'specialty', label: 'Especialidad', options: Array.from(new Set(teacherList.map((teacher) => teacher.specialty))) },
                    { key: 'role', label: 'Rol', options: onToggleAdministrator ? ['Profesor', 'Administrador'] : Array.from(new Set(teacherList.map((teacher) => teacher.role === 'Docente' ? 'Profesor' : 'Administrador'))) },
                    { key: 'status', label: 'Estado', options: Array.from(new Set(teacherList.map((teacher) => teacher.status))) },
                ]}
                onApplyFilters={(filters) => {
                    setActiveFilters({ specialty: filters.specialty ?? '', role: filters.role ?? '', status: filters.status ?? '' })
                    setCurrentPage(1)
                }}
                toolbar={{
                    filters: { label: 'Filtros', variant: 'secondary' },
                    create: { label: 'Nuevo', onClick: () => setIsCreateModalOpen(true), variant: 'primary' },
                }}
            >
                <DataTable
                    rows={paginatedTeachers}
                    getRowKey={(teacher) => teacher.id}
                    pagination={{
                        currentPage,
                        totalPages,
                        onPageChange: setCurrentPage,
                    }}
                    columns={[
                        {
                            key: 'teacher',
                            header: 'Profesor',
                            accessor: (teacher) => (
                                <div className="student-cell">
                                    <div className="student-avatar">{teacher.fullName.charAt(0)}</div>
                                    <div>
                                        <strong>{teacher.fullName}</strong>
                                    </div>
                                </div>
                            ),
                        },
                        {
                            key: 'specialty',
                            header: 'Especialidad',
                            accessor: (teacher) => <span>{teacher.specialty}</span>,
                        },
                        {
                            key: 'contact',
                            header: 'Contacto',
                            accessor: (teacher) => <MetaCell primary={teacher.phone} secondary={teacher.email} />,
                        },
                        {
                            key: 'role',
                            header: 'Rol',
                            accessor: (teacher) => <div className="staff-role-badges">{teacher.role === 'Docente' && <span>Profesor</span>}{administratorIds?.includes(teacher.id) && <span className="admin">Administrador</span>}{teacher.role !== 'Docente' && !administratorIds?.includes(teacher.id) && <span>Administrador</span>}</div>,
                        },
                        {
                            key: 'status',
                            header: 'Estado',
                            accessor: (teacher) => <StatusBadge label={teacher.status} tone={statusToneMap[teacher.status]} />,
                            align: 'center',
                        },
                    ]}
                    renderActions={(teacher) => (
                        <RowActionMenu
                            ariaLabel={`Acciones para ${teacher.fullName}`}
                            active={openMenuId === teacher.id}
                            onToggle={() => setOpenMenuId((current) => (current === teacher.id ? null : teacher.id))}
                            actions={[
                                {
                                    label: 'Editar', icon: <PencilLine size={15} />, onClick: () => {
                                        const isAdministrator = administratorIds?.includes(teacher.id) ?? false
                                        setEditingTeacher(teacher)
                                        setEditingTeacherForm({ ...emptyTeacherForm, ...teacher })
                                        setEditingIsAdministrator(isAdministrator)
                                        setEditingInitialIsAdministrator(isAdministrator)
                                        setIsEditModalOpen(true)
                                    }
                                },
                                { label: 'Eliminar', icon: <Trash2 size={15} />, onClick: () => setDeleteTarget(teacher), variant: 'danger' },
                            ]}
                        />
                    )}
                    emptyLabel="No se encontraron profesores con esos filtros."
                />
            </CrudListPage>
        </>
    )
}
