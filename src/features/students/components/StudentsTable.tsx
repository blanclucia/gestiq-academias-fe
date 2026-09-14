import { BookOpen, Eye, PencilLine, Trash2, UserPlus, UserRoundMinus } from 'lucide-react'
import { MetaCell } from '@/components/ui/ContactCell'
import { DataTable } from '@/components/ui/DataTable'
import { EntityCell } from '@/components/ui/PersonCell'
import { RowActionMenu } from '@/components/ui/RowActionMenu'
import { StatusBadge, type StatusBadgeTone } from '@/components/ui/StatusBadge'
import type { Student } from '@/types/domain'

type Props = {
    rows: Student[]
    selectedIds: string[]
    selectAllChecked: boolean
    openMenuId: string | null
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    onToggleSelection: (id: string) => void
    onToggleSelectAll: () => void
    onToggleMenu: (id: string) => void
    onView: (student: Student) => void
    onAssign: (student: Student) => void
    onPrivateLesson: (student: Student) => void
    onEdit: (student: Student) => void
    onStatus: (student: Student) => void
    onDelete: (student: Student) => void
}

const statusToneMap: Record<Student['status'], StatusBadgeTone> = { Activo: 'success', Pendiente: 'warning', Inactivo: 'neutral' }

export function StudentsTable(props: Props) {
    return <DataTable
        rows={props.rows}
        getRowKey={(student) => student.id}
        onRowClick={props.onView}
        pagination={{ currentPage: props.currentPage, totalPages: props.totalPages, onPageChange: props.onPageChange }}
        columns={[
            { key: 'select', header: <input type="checkbox" checked={props.selectAllChecked} onChange={props.onToggleSelectAll} aria-label="Seleccionar todos" />, accessor: (student) => <input type="checkbox" checked={props.selectedIds.includes(student.id)} onChange={() => props.onToggleSelection(student.id)} aria-label={`Seleccionar ${student.fullName}`} />, align: 'center' },
            { key: 'student', header: 'Alumno', accessor: (student) => <EntityCell name={student.fullName} subtitle={student.document} avatar={student.fullName.charAt(0)} /> },
            { key: 'courses', header: 'Cursos / Comisiones', accessor: (student) => <div className="student-tags-cell">{student.courses.map((course) => <div key={`${student.id}-${course.name}-${course.group}`} className="student-badge"><span className="student-badge-name">{course.name}</span><span className="student-badge-group">{course.group}</span></div>)}</div> },
            { key: 'contact', header: 'Contacto', accessor: (student) => <MetaCell primary={student.email} secondary={student.phone} /> },
            { key: 'status', header: 'Estado', accessor: (student) => <StatusBadge label={student.status} tone={statusToneMap[student.status]} />, align: 'center' },
        ]}
        renderActions={(student) => <RowActionMenu ariaLabel={`Acciones para ${student.fullName}`} active={props.openMenuId === student.id} onToggle={() => props.onToggleMenu(student.id)} actions={[
            { label: 'Ver detalle', icon: <Eye size={15} />, onClick: () => props.onView(student) },
            { label: 'Asignar a comisión', icon: <UserPlus size={15} />, onClick: () => props.onAssign(student) },
            { label: 'Crear clase particular', icon: <BookOpen size={15} />, onClick: () => props.onPrivateLesson(student) },
            { label: 'Editar', icon: <PencilLine size={15} />, onClick: () => props.onEdit(student) },
            { label: student.status === 'Inactivo' ? 'Reactivar' : 'Pausar', icon: <UserRoundMinus size={15} />, onClick: () => props.onStatus(student) },
            { label: 'Eliminar', icon: <Trash2 size={15} />, onClick: () => props.onDelete(student), variant: 'danger' },
        ]} />}
        emptyLabel="No se encontraron alumnos con esos filtros."
    />
}
