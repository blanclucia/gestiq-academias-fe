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
import { createStaff, listStaff, removeStaff, updateStaff, useAcademyRepositoryVersion } from '@/services/academyRepository'
import { validateConditions } from '@/components/forms/formValidation'

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
    role: 'Docente' as Teacher['role'],
    status: 'Activo' as Teacher['status'],
}

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
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newTeacher, setNewTeacher] = useState(emptyTeacherForm)
    const [newIsAdministrator, setNewIsAdministrator] = useState(false)
    const [createError, setCreateError] = useState('')
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
    const [editingTeacherForm, setEditingTeacherForm] = useState(emptyTeacherForm)
    const [editingIsAdministrator, setEditingIsAdministrator] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null)
    const teacherList = listStaff().filter((member) => !staffIds || staffIds.includes(member.id))
    const [activeFilters, setActiveFilters] = useState({ teacher: '', specialty: '', role: '', status: '' })
    const filteredTeacherList = teacherList.filter((teacher) =>
        (!activeFilters.teacher || teacher.fullName === activeFilters.teacher)
        && (!activeFilters.specialty || teacher.specialty === activeFilters.specialty)
        && (!activeFilters.role || (activeFilters.role === 'Profesor' ? teacher.role === 'Docente' : activeFilters.role === 'Administrador' ? administratorIds?.includes(teacher.id) : teacher.role === activeFilters.role))
        && (!activeFilters.status || teacher.status === activeFilters.status),
    )

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
                validate={() => validateConditions({ teacherFirstName: !newTeacher.firstName.trim() && 'Ingresá el nombre.', teacherLastName: !newTeacher.lastName.trim() && 'Ingresá el apellido.', teacherEmail: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newTeacher.email) && 'Ingresá un email válido.', teacherRole: newTeacher.role !== 'Docente' && !newIsAdministrator && 'Asigná permisos de administración.' }, 'Revisá los datos del integrante.')}
                onClose={() => {
                    setIsCreateModalOpen(false)
                    setNewTeacher(emptyTeacherForm)
                    setNewIsAdministrator(false)
                    setCreateError('')
                }}
                onSubmit={() => {
                    if (!newTeacher.firstName.trim() || !newTeacher.lastName.trim() || !newTeacher.email.trim()) {
                        setCreateError('Completá nombre, apellido y email.')
                        return
                    }
                    if (newTeacher.role !== 'Docente' && !newIsAdministrator) {
                        setCreateError('Seleccioná al menos un rol.')
                        return
                    }

                    const created = createStaff({ ...newTeacher, fullName: `${newTeacher.firstName.trim()} ${newTeacher.lastName.trim()}`, email: newTeacher.email.trim(), phone: newTeacher.phone.trim(), specialty: newTeacher.specialty.trim() })
                    onStaffCreated?.(created.id)
                    if (newIsAdministrator) onToggleAdministrator?.(created.id, true)
                    setIsCreateModalOpen(false)
                    setNewTeacher(emptyTeacherForm)
                    setNewIsAdministrator(false)
                    setCreateError('')
                }}
            >
                <div className="form-stack">
                    <FormSection title="Datos del integrante">
                        <FormGrid>
                            <FormField label="Nombre" required>
                                <input className="form-input" type="text" value={newTeacher.firstName} onChange={(event) => setNewTeacher((current) => ({ ...current, firstName: event.target.value }))} />
                            </FormField>
                            <FormField label="Apellido" required>
                                <input className="form-input" type="text" value={newTeacher.lastName} onChange={(event) => setNewTeacher((current) => ({ ...current, lastName: event.target.value }))} />
                            </FormField>
                            <FormField label="Email" required>
                                <input className="form-input" type="email" value={newTeacher.email} onChange={(event) => setNewTeacher((current) => ({ ...current, email: event.target.value }))} />
                            </FormField>
                            <FormField label="Teléfono">
                                <input className="form-input" type="tel" value={newTeacher.phone} onChange={(event) => setNewTeacher((current) => ({ ...current, phone: event.target.value }))} />
                            </FormField>
                            <FormField label="Especialidad o área">
                                <input className="form-input" type="text" value={newTeacher.specialty} onChange={(event) => setNewTeacher((current) => ({ ...current, specialty: event.target.value }))} placeholder="Ej. Inglés, Administración" />
                            </FormField>
                            <FormField label="Roles">
                                <div className="staff-role-picker"><label><input type="checkbox" checked={newTeacher.role === 'Docente'} onChange={(event) => { setNewTeacher((current) => ({ ...current, role: event.target.checked ? 'Docente' : 'Administrativo' })); if (!event.target.checked) setNewIsAdministrator(true) }} />Profesor</label>{onToggleAdministrator && <label><input type="checkbox" checked={newIsAdministrator} onChange={(event) => { setNewIsAdministrator(event.target.checked); if (!event.target.checked && newTeacher.role !== 'Docente') setNewTeacher((current) => ({ ...current, role: 'Docente' })) }} />Administrador</label>}</div>
                            </FormField>
                            <FormField label="Estado">
                                <select className="form-input" value={newTeacher.status} onChange={(event) => setNewTeacher((current) => ({ ...current, status: event.target.value as Teacher['status'] }))}>
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo</option>
                                </select>
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
                validate={() => validateConditions({ teacherFirstName: !editingTeacherForm.firstName.trim() && 'Ingresá el nombre.', teacherLastName: !editingTeacherForm.lastName.trim() && 'Ingresá el apellido.', teacherEmail: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingTeacherForm.email) && 'Ingresá un email válido.', teacherRole: editingTeacherForm.role !== 'Docente' && !editingIsAdministrator && 'Asigná permisos de administración.' }, 'Revisá los datos del integrante.')}
                onClose={() => {
                    setIsEditModalOpen(false)
                    setEditingTeacher(null)
                    setEditingTeacherForm(emptyTeacherForm)
                    setEditingIsAdministrator(false)
                }}
                onSubmit={() => {
                    if (editingTeacher && editingTeacherForm.firstName.trim() && editingTeacherForm.lastName.trim() && editingTeacherForm.email.trim()) {
                        updateStaff(editingTeacher.id, {
                            ...editingTeacherForm,
                            fullName: `${editingTeacherForm.firstName.trim()} ${editingTeacherForm.lastName.trim()}`,
                            email: editingTeacherForm.email.trim(),
                            phone: editingTeacherForm.phone.trim(),
                            specialty: editingTeacherForm.specialty.trim(),
                        })
                        onToggleAdministrator?.(editingTeacher.id, editingIsAdministrator)
                    }
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
                                <input className="form-input" type="text" value={editingTeacherForm.firstName} onChange={(event) => setEditingTeacherForm((current) => ({ ...current, firstName: event.target.value }))} />
                            </FormField>
                            <FormField label="Apellido" required>
                                <input className="form-input" type="text" value={editingTeacherForm.lastName} onChange={(event) => setEditingTeacherForm((current) => ({ ...current, lastName: event.target.value }))} />
                            </FormField>
                            <FormField label="Email" required>
                                <input className="form-input" type="email" value={editingTeacherForm.email} onChange={(event) => setEditingTeacherForm((current) => ({ ...current, email: event.target.value }))} />
                            </FormField>
                            <FormField label="Teléfono">
                                <input className="form-input" type="tel" value={editingTeacherForm.phone} onChange={(event) => setEditingTeacherForm((current) => ({ ...current, phone: event.target.value }))} />
                            </FormField>
                            <FormField label="Especialidad">
                                <input className="form-input" type="text" value={editingTeacherForm.specialty} onChange={(event) => setEditingTeacherForm((current) => ({ ...current, specialty: event.target.value }))} />
                            </FormField>
                            <FormField label="Roles">
                                <div className="staff-role-picker"><label><input type="checkbox" checked={editingTeacherForm.role === 'Docente'} onChange={(event) => { setEditingTeacherForm((current) => ({ ...current, role: event.target.checked ? 'Docente' : 'Administrativo' })); if (!event.target.checked) setEditingIsAdministrator(true) }} />Profesor</label>{onToggleAdministrator && <label><input type="checkbox" checked={editingIsAdministrator} onChange={(event) => { setEditingIsAdministrator(event.target.checked); if (!event.target.checked && editingTeacherForm.role !== 'Docente') setEditingTeacherForm((current) => ({ ...current, role: 'Docente' })) }} />Administrador</label>}</div>
                            </FormField>
                            <FormField label="Estado">
                                <select className="form-input" value={editingTeacherForm.status} onChange={(event) => setEditingTeacherForm((current) => ({ ...current, status: event.target.value as Teacher['status'] }))}>
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo</option>
                                </select>
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
                        removeStaff(deleteTarget.id)
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
                    { key: 'teacher', label: 'Profesor', options: teacherList.map((teacher) => teacher.fullName) },
                    { key: 'specialty', label: 'Especialidad', options: Array.from(new Set(teacherList.map((teacher) => teacher.specialty))) },
                    { key: 'role', label: 'Rol', options: onToggleAdministrator ? ['Profesor', 'Administrador'] : Array.from(new Set(teacherList.map((teacher) => teacher.role === 'Docente' ? 'Profesor' : 'Administrador'))) },
                    { key: 'status', label: 'Estado', options: Array.from(new Set(teacherList.map((teacher) => teacher.status))) },
                ]}
                onApplyFilters={(filters) => {
                    setActiveFilters({ teacher: filters.teacher ?? '', specialty: filters.specialty ?? '', role: filters.role ?? '', status: filters.status ?? '' })
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
                                        setEditingTeacher(teacher)
                                        setEditingTeacherForm({ ...teacher })
                                        setEditingIsAdministrator(administratorIds?.includes(teacher.id) ?? false)
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
