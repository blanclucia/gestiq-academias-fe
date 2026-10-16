import { BookOpen, Eye, PencilLine, Trash2, XCircle } from 'lucide-react'
import { DataTable } from '@/components/ui/DataTable'
import { EntityCell } from '@/components/ui/PersonCell'
import { RowActionMenu } from '@/components/ui/RowActionMenu'
import { StatusBadge, type StatusBadgeTone } from '@/components/ui/StatusBadge'
import { formatCurrencyARS, formatShortDate } from '@/domain/shared/formattingRules'

export type PrivateStudentRow = {
    id: string
    studentId: string
    student: string
    teacherId: string
    teacher: string
    purpose: string
    plan: string
    startDate: string
    endDate: string
    costPerClass: number
    nextClass: string
    // Sum of the lesson's unpaid charges.
    pendingAmount: number
    days: string[]
    fromTime: string
    toTime: string
    status: 'Activa' | 'Pausada' | 'Finalizada'
}

type Props = {
    rows: PrivateStudentRow[]
    currentPage: number
    totalPages: number
    openMenuId: string | null
    onPageChange: (page: number) => void
    onToggleMenu: (id: string) => void
    onView: (row: PrivateStudentRow) => void
    onCollect: (row: PrivateStudentRow) => void
    onEdit: (row: PrivateStudentRow) => void
    onCancel: (row: PrivateStudentRow) => void
    onDelete: (row: PrivateStudentRow) => void
}

const statusToneMap: Record<PrivateStudentRow['status'], StatusBadgeTone> = {
    Activa: 'success',
    Pausada: 'warning',
    Finalizada: 'neutral',
}

export function PrivateLessonsTable(props: Props) {
    return <DataTable
        rows={props.rows}
        getRowKey={(item) => item.id}
        onRowClick={props.onView}
        pagination={{ currentPage: props.currentPage, totalPages: props.totalPages, onPageChange: props.onPageChange }}
        columns={[
            { key: 'student', header: 'Alumno', accessor: (item) => <EntityCell name={item.student} avatar={item.student.charAt(0)} /> },
            { key: 'teacher', header: 'Docente', accessor: (item) => <strong>{item.teacher}</strong> },
            { key: 'purpose', header: 'Motivo', accessor: (item) => item.purpose },
            { key: 'plan', header: 'Plan', accessor: (item) => item.plan },
            // The monthly plan's cost is per month; the other plans', per class.
            { key: 'costPerClass', header: 'Costo', accessor: (item) => <span><strong>{formatCurrencyARS(item.costPerClass)}</strong><small style={{ display: 'block', color: 'var(--muted)' }}>{item.plan === 'Plan mensual' ? 'por mes' : 'por clase'}</small></span>, align: 'right' },
            { key: 'validity', header: 'Vigencia', accessor: (item) => <span>{formatShortDate(item.startDate, '-')} al {formatShortDate(item.endDate, '-')}</span> },
            { key: 'nextClass', header: 'Próxima clase', accessor: (item) => item.nextClass },
            { key: 'pending', header: 'Pendiente de cobro', accessor: (item) => <strong>{formatCurrencyARS(item.pendingAmount)}</strong>, align: 'right' },
            { key: 'status', header: 'Estado', accessor: (item) => <StatusBadge label={item.status} tone={statusToneMap[item.status]} />, align: 'center' },
        ]}
        renderActions={(item) => <RowActionMenu ariaLabel={`Acciones para ${item.student}`} active={props.openMenuId === item.id} onToggle={() => props.onToggleMenu(item.id)} actions={[
            { label: 'Ver alumno', icon: <Eye size={15} />, onClick: () => props.onView(item) },
            { label: 'Cobrar', icon: <BookOpen size={15} />, onClick: () => props.onCollect(item) },
            { label: 'Reprogramar', icon: <PencilLine size={15} />, onClick: () => props.onEdit(item) },
            { label: 'Cancelar clase', icon: <XCircle size={15} />, onClick: () => props.onCancel(item), variant: 'danger' },
            { label: 'Eliminar', icon: <Trash2 size={15} />, onClick: () => props.onDelete(item), variant: 'danger' },
        ]} />}
        emptyLabel="No hay alumnos con clases particulares para esta oferta académica."
    />
}
