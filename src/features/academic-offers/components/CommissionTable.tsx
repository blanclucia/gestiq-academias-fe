import { DataTable } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { AcademicCommission } from '@/services/academyRepository'
import { CommissionActions } from './CommissionActions'

type Props = { rows: AcademicCommission[]; openMenuId: string | null; onToggleMenu: (id: string) => void; onView: (commission: AcademicCommission) => void; onDuplicate: (commission: AcademicCommission) => void; onEdit: (commission: AcademicCommission) => void; onDelete: (commission: AcademicCommission) => void }
const formatShortDate = (value: string) => value.split('-').reverse().join('/')

export function CommissionTable({ rows, openMenuId, onToggleMenu, onView, onDuplicate, onEdit, onDelete }: Props) {
    return <DataTable rows={rows} getRowKey={(commission) => commission.id} onRowClick={onView} emptyLabel="No hay comisiones para esta oferta académica." columns={[
        { key: 'name', header: 'Comisión', accessor: (commission) => <div><strong>{commission.name}</strong><small className="table-secondary-text">{commission.teachers.join(', ') || 'Sin profesores asignados'}</small></div> },
        { key: 'schedule', header: 'Horario', accessor: (commission) => commission.schedule },
        { key: 'period', header: 'Vigencia', accessor: (commission) => `${formatShortDate(commission.startDate)} al ${formatShortDate(commission.endDate)}` },
        { key: 'capacity', header: 'Cupos', accessor: (commission) => `${commission.studentsCount}/${commission.capacity}`, align: 'center' },
        { key: 'amount', header: 'Valor mensual', accessor: (commission) => <strong>${commission.amount.toLocaleString('es-AR')}</strong>, align: 'right' },
        { key: 'status', header: 'Estado', accessor: (commission) => <StatusBadge label={commission.status} tone={commission.status === 'Activa' ? 'success' : commission.status === 'Programada' ? 'warning' : 'neutral'} />, align: 'center' },
    ]} renderActions={(commission) => <CommissionActions commission={commission} active={openMenuId === commission.id} onToggle={() => onToggleMenu(commission.id)} onView={() => onView(commission)} onDuplicate={() => onDuplicate(commission)} onEdit={() => onEdit(commission)} onDelete={() => onDelete(commission)} />} />
}
