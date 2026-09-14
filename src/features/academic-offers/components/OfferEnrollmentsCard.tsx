import { CheckCircle2, PencilLine, Plus, Search, Trash2, UserRoundCheck } from 'lucide-react'
import { DataTable } from '@/components/ui/DataTable'
import { RowActionMenu } from '@/components/ui/RowActionMenu'
import { StatusBadge } from '@/components/ui/StatusBadge'

export type OfferEnrollmentRow = {
    id: string
    courseId: string
    commissionIds: string[]
    commissions: string
    amount: number
    startDate: string
    endDate: string
    status: 'Abierta' | 'Programada' | 'Cerrada'
    studentsCount: number
}

type Props = { courseName: string; rows: OfferEnrollmentRow[]; search: string; openMenuId: string | null; onSearchChange: (value: string) => void; onOpenFilters: () => void; onCreate: () => void; onToggleMenu: (id: string) => void; onView: (row: OfferEnrollmentRow) => void; onEdit: (row: OfferEnrollmentRow) => void; onCloseEnrollment: (row: OfferEnrollmentRow) => void; onDelete: (row: OfferEnrollmentRow) => void }
const formatShortDate = (value: string) => value.split('-').reverse().join('/')

export function OfferEnrollmentsCard(props: Props) {
    return <section className="data-table-card offer-enrollments-card" style={{ padding: 20 }}><div style={{ marginTop: 0 }}>
        <div className="offer-overview-eyebrow"><UserRoundCheck size={15} /> Inscripciones</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 280px', maxWidth: 520, minWidth: 260 }}>
                <label className="search-input-wrap" style={{ flex: 1, minWidth: 0 }}><Search aria-hidden="true" size={16} strokeWidth={2.2} className="search-input-icon" /><input type="text" value={props.search} onChange={(event) => props.onSearchChange(event.target.value)} placeholder="Buscar período o estado" /></label>
                <button type="button" className="secondary-button compact-button" onClick={props.onOpenFilters}>Filtros</button>
            </div>
            <button type="button" className="primary-button compact-button" onClick={props.onCreate}><Plus size={16} /> Lanzar autoinscripción</button>
        </div>
        <DataTable rows={props.rows} getRowKey={(row) => row.id} onRowClick={props.onView} emptyLabel="No hay inscripciones para esta oferta académica." columns={[
            { key: 'period', header: 'Período', accessor: (row) => <div><strong>{formatShortDate(row.startDate)} al {formatShortDate(row.endDate)}</strong><small className="table-secondary-text">{row.commissions} disponibles</small></div> },
            { key: 'amount', header: 'Costo', accessor: (row) => <strong>${row.amount.toLocaleString('es-AR')}</strong>, align: 'right' },
            { key: 'students', header: 'Inscriptos', accessor: (row) => row.studentsCount, align: 'center' },
            { key: 'status', header: 'Estado', accessor: (row) => <StatusBadge label={row.status} tone={row.status === 'Abierta' ? 'success' : row.status === 'Programada' ? 'warning' : 'neutral'} />, align: 'center' },
        ]} renderActions={(row) => <RowActionMenu ariaLabel={`Acciones para inscripción de ${props.courseName}`} active={props.openMenuId === row.id} onToggle={() => props.onToggleMenu(row.id)} actions={[
            { label: 'Ver detalle', icon: <UserRoundCheck size={15} />, onClick: () => props.onView(row) },
            { label: 'Editar', icon: <PencilLine size={15} />, onClick: () => props.onEdit(row) },
            { label: 'Cerrar', icon: <CheckCircle2 size={15} />, onClick: () => props.onCloseEnrollment(row) },
            { label: 'Eliminar', icon: <Trash2 size={15} />, onClick: () => props.onDelete(row), variant: 'danger' },
        ]} />} />
    </div></section>
}
