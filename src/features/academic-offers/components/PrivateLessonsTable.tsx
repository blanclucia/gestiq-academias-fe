import { BookOpen, Eye, PencilLine, Trash2 } from 'lucide-react'
import { DataTable } from '@/components/ui/DataTable'
import { EntityCell } from '@/components/ui/PersonCell'
import { RowActionMenu } from '@/components/ui/RowActionMenu'
import { StatusBadge, type StatusBadgeTone } from '@/components/ui/StatusBadge'

export type PrivateStudentRow = {
    id: string
    studentId: string
    student: string
    teacher: string
    purpose: string
    plan: string
    startDate: string
    endDate: string
    costPerClass: number
    nextClass: string
    balance: number
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
            { key: 'student', header: 'Alumno', accessor: (item) => <EntityCell name={item.student} subtitle={item.teacher} avatar={item.student.charAt(0)} /> },
            { key: 'teacher', header: 'Docente', accessor: (item) => <strong>{item.teacher}</strong> },
            { key: 'purpose', header: 'Motivo', accessor: (item) => item.purpose },
            { key: 'plan', header: 'Plan', accessor: (item) => item.plan },
            { key: 'costPerClass', header: 'Costo por clase', accessor: (item) => <strong>${item.costPerClass.toLocaleString('es-AR')}</strong>, align: 'right' },
            { key: 'validity', header: 'Vigencia', accessor: (item) => <span>{item.startDate} al {item.endDate}</span> },
            { key: 'nextClass', header: 'Próxima clase', accessor: (item) => item.nextClass },
            { key: 'balance', header: 'Saldo', accessor: (item) => <strong>{item.balance} clase{item.balance === 1 ? '' : 's'}</strong>, align: 'center' },
            { key: 'status', header: 'Estado', accessor: (item) => <StatusBadge label={item.status} tone={statusToneMap[item.status]} />, align: 'center' },
        ]}
        renderActions={(item) => <RowActionMenu ariaLabel={`Acciones para ${item.student}`} active={props.openMenuId === item.id} onToggle={() => props.onToggleMenu(item.id)} actions={[
            { label: 'Ver alumno', icon: <Eye size={15} />, onClick: () => props.onView(item) },
            { label: 'Cobrar', icon: <BookOpen size={15} />, onClick: () => props.onCollect(item) },
            { label: 'Reprogramar', icon: <PencilLine size={15} />, onClick: () => props.onEdit(item) },
            { label: 'Cancelar', icon: <Trash2 size={15} />, onClick: () => props.onCancel(item), variant: 'danger' },
        ]} />}
        emptyLabel="No hay alumnos con clases particulares para esta oferta académica."
    />
}
