import { Plus, Search, Users } from 'lucide-react'
import type { AcademicCommission } from '@/services/academyRepository'
import { CommissionTable } from './CommissionTable'

type Props = { rows: AcademicCommission[]; search: string; openMenuId: string | null; onSearchChange: (value: string) => void; onOpenFilters: () => void; onCreate: () => void; onToggleMenu: (id: string) => void; onView: (commission: AcademicCommission) => void; onDuplicate: (commission: AcademicCommission) => void; onEdit: (commission: AcademicCommission) => void; onDelete: (commission: AcademicCommission) => void }

export function OfferCommissionsCard(props: Props) {
    return <section className="data-table-card offer-commissions-card" style={{ padding: 20 }}><div style={{ marginTop: 0 }}>
        <div className="offer-overview-eyebrow"><Users size={15} /> Comisiones</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 280px', maxWidth: 520, minWidth: 260 }}>
                <label className="search-input-wrap" style={{ flex: 1, minWidth: 0 }}><Search aria-hidden="true" size={16} strokeWidth={2.2} className="search-input-icon" /><input type="text" value={props.search} onChange={(event) => props.onSearchChange(event.target.value)} placeholder="Buscar comisión, docente o horario" /></label>
                <button type="button" className="secondary-button compact-button" onClick={props.onOpenFilters}>Filtros</button>
            </div>
            <button type="button" className="primary-button compact-button" onClick={props.onCreate}><Plus size={16} /> Nueva comisión</button>
        </div>
        <CommissionTable rows={props.rows} openMenuId={props.openMenuId} onToggleMenu={props.onToggleMenu} onView={props.onView} onDuplicate={props.onDuplicate} onEdit={props.onEdit} onDelete={props.onDelete} />
    </div></section>
}
