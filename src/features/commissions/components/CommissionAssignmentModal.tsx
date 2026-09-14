import { useMemo, useState } from 'react'
import { EntityFormModal, FormField, FormSection } from '@/components/crud/EntityFormModal'
import { validateConditions } from '@/components/forms/formValidation'

export type AssignmentStudent = {
    id: string
    fullName: string
    status: 'Activo' | 'Pendiente' | 'Inactivo'
    courses: Array<{ name: string; group: string }>
}

export type AssignmentCommission = {
    id: string
    courseName: string
    commissionName: string
    studentsCount: number
    capacity: number
    amount: number
    schedule: string
    status: 'Activa' | 'Programada' | 'Cerrada'
}

type AssignmentResult = {
    commission: AssignmentCommission
    studentIds: string[]
}

export function CommissionAssignmentModal({
    open,
    students,
    selectedStudentIds,
    commissions,
    initialCommissionId = '',
    allowStudentSelection = false,
    onClose,
    onConfirm,
}: {
    open: boolean
    students: AssignmentStudent[]
    selectedStudentIds: string[]
    commissions: AssignmentCommission[]
    initialCommissionId?: string
    allowStudentSelection?: boolean
    onClose: () => void
    onConfirm: (result: AssignmentResult) => void
}) {
    const [commissionId, setCommissionId] = useState(initialCommissionId || commissions[0]?.id || '')
    const [chosenStudentIds, setChosenStudentIds] = useState(selectedStudentIds)
    const [step, setStep] = useState<'select' | 'confirm'>(allowStudentSelection ? 'select' : 'confirm')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'Todos' | AssignmentStudent['status']>('Todos')
    const reset = () => {
        setCommissionId(initialCommissionId || commissions[0]?.id || '')
        setChosenStudentIds(selectedStudentIds)
        setStep(allowStudentSelection ? 'select' : 'confirm')
        setSearch('')
        setStatusFilter('Todos')
    }

    const commission = commissions.find((item) => item.id === commissionId) ?? null
    const selectedStudents = students.filter((student) => chosenStudentIds.includes(student.id))
    const alreadyAssigned = useMemo(
        () => selectedStudents.filter((student) => commission && student.courses.some((course) => course.name === commission.courseName && course.group === commission.commissionName)),
        [commission, selectedStudents],
    )
    const candidates = selectedStudents.filter((student) => !alreadyAssigned.includes(student) && student.status !== 'Inactivo')
    const availableSeats = commission ? Math.max(commission.capacity - commission.studentsCount, 0) : 0
    const assignableStudents = candidates.slice(0, availableSeats)
    const waitlistedStudents = candidates.slice(availableSeats)
    const filteredStudents = students.filter((student) => {
        const matchesSearch = `${student.fullName} ${student.id}`.toLowerCase().includes(search.toLowerCase())
        const alreadyInCommission = Boolean(commission && student.courses.some((course) => course.name === commission.courseName && course.group === commission.commissionName))
        return !alreadyInCommission && matchesSearch && (statusFilter === 'Todos' || student.status === statusFilter)
    })
    const filteredSelectableIds = filteredStudents.filter((student) => student.status !== 'Inactivo').map((student) => student.id)
    const isAllFilteredSelected = filteredSelectableIds.length > 0 && filteredSelectableIds.every((id) => chosenStudentIds.includes(id))

    return (
        <EntityFormModal
            open={open}
            title={allowStudentSelection && step === 'select' ? 'Seleccionar alumnos' : selectedStudents.length === 1 ? 'Asignar alumno a comisión' : 'Asignar alumnos a comisión'}
            subtitle={allowStudentSelection && step === 'select' ? 'Buscá, filtrá y seleccioná los alumnos que querés incorporar a esta comisión.' : 'La asignación manual incorpora a los alumnos directamente a esta comisión.'}
            submitLabel={allowStudentSelection && step === 'select' ? `Continuar con ${selectedStudents.length}` : `Asignar ${assignableStudents.length} alumno${assignableStudents.length === 1 ? '' : 's'}`}
            validate={() => validateConditions({ assignmentStudents: allowStudentSelection && step === 'select' && selectedStudents.length === 0 && 'Seleccioná al menos un alumno.', assignmentCommission: step === 'confirm' && !commission && 'Seleccioná una comisión.', assignmentCapacity: step === 'confirm' && assignableStudents.length === 0 && 'La comisión no tiene cupos disponibles.' }, 'Revisá la asignación.')}
            onClose={() => {
                reset()
                onClose()
            }}
            onSubmit={() => {
                if (allowStudentSelection && step === 'select') {
                    setStep('confirm')
                } else if (commission && assignableStudents.length > 0) {
                    onConfirm({ commission, studentIds: assignableStudents.map((student) => student.id) })
                    reset()
                }
            }}
        >
            <div className="form-stack">
                {allowStudentSelection && step === 'select' ? (
                    <FormSection title="Alumnos disponibles">
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <label className="search-input-wrap" style={{ flex: '1 1 240px' }}>
                                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre o legajo" />
                            </label>
                            <select className="form-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} style={{ width: 150 }}>
                                <option value="Todos">Todos los estados</option>
                                <option value="Activo">Activos</option>
                                <option value="Pendiente">Pendientes</option>
                                <option value="Inactivo">Inactivos</option>
                            </select>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 13, fontWeight: 700 }}>
                            <input
                                type="checkbox"
                                checked={isAllFilteredSelected}
                                onChange={() => setChosenStudentIds((current) => isAllFilteredSelected ? current.filter((id) => !filteredSelectableIds.includes(id)) : Array.from(new Set([...current, ...filteredSelectableIds])))}
                            />
                            Seleccionar resultados filtrados ({filteredSelectableIds.length})
                        </label>

                        <div style={{ display: 'grid', gap: 6, maxHeight: 280, overflow: 'auto', marginTop: 10 }}>
                            {filteredStudents.map((student) => {
                                const isSelected = chosenStudentIds.includes(student.id)
                                const isInactive = student.status === 'Inactivo'
                                const courseLabel = student.courses.map((course) => `${course.name} · ${course.group}`).join(' · ')

                                return (
                                    <label key={student.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10, opacity: isInactive ? 0.55 : 1 }}>
                                        <input type="checkbox" checked={isSelected} disabled={isInactive} onChange={() => setChosenStudentIds((current) => isSelected ? current.filter((id) => id !== student.id) : [...current, student.id])} />
                                        <span style={{ minWidth: 0 }}>
                                            <strong>{student.fullName}</strong>
                                            <small style={{ display: 'block', color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.status} · {courseLabel || 'Sin comisión asignada'}</small>
                                        </span>
                                    </label>
                                )
                            })}
                            {filteredStudents.length === 0 && <div style={{ color: 'var(--muted)', padding: 8 }}>No hay alumnos disponibles para esos filtros.</div>}
                        </div>
                    </FormSection>
                ) : (
                    <>
                        {allowStudentSelection && <button type="button" className="ghost-button" onClick={() => setStep('select')} style={{ justifyContent: 'flex-start' }}>← Volver a la selección</button>}
                        <FormSection title="Comisión de destino">
                            <FormField label="Curso y comisión">
                                <select className="form-input" value={commissionId} onChange={(event) => setCommissionId(event.target.value)}>
                                    {commissions.map((item) => (
                                        <option key={item.id} value={item.id} disabled={item.status === 'Cerrada'}>
                                            {item.courseName} · {item.commissionName} ({item.studentsCount}/{item.capacity})
                                        </option>
                                    ))}
                                </select>
                            </FormField>

                            {commission && (
                                <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                                    {commission.schedule} · ${commission.amount.toLocaleString('es-AR')} mensuales · {availableSeats} cupos disponibles
                                </div>
                            )}
                        </FormSection>

                        <FormSection title="Validación de la selección">
                            <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                                <div><strong>{assignableStudents.length}</strong> listos para asignar</div>
                                {alreadyAssigned.length > 0 && <div style={{ color: 'var(--muted)' }}>{alreadyAssigned.length} ya pertenecen a esta comisión</div>}
                                {selectedStudents.filter((student) => student.status === 'Inactivo').length > 0 && <div style={{ color: 'var(--muted)' }}>Los alumnos inactivos no se asignarán</div>}
                                {waitlistedStudents.length > 0 && <div style={{ color: 'var(--orange)' }}>{waitlistedStudents.length} quedarán sin asignar por falta de cupo</div>}
                                <div style={{ color: 'var(--muted)' }}>{selectedStudents.map((student) => student.fullName).join(' · ') || 'No seleccionaste alumnos'}</div>
                            </div>
                        </FormSection>
                    </>
                )}
            </div>
        </EntityFormModal>
    )
}
