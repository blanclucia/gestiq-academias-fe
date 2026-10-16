import { CalendarDays, Clock3 } from 'lucide-react'
import { getEligibleCommissions } from '@/domain/commissions/commissionRules'
import { formatShortDate } from '@/domain/shared/formattingRules'
import type { AcademicCommission } from '@/services/academyRepository'

type Props = {
    commissions: AcademicCommission[]
    // Enrollment start date: commissions that finished before it aren't offered.
    startDate: string
    value: string[]
    onChange: (commissionIds: string[]) => void
    showHeader?: boolean
}

// Checkbox list of the commissions an enrollment can include, with schedule, capacity and dates so
// commissions with the same schedule can be told apart. Used when launching and editing an enrollment.
export function EligibleCommissionsPicker({ commissions, startDate, value, onChange, showHeader = true }: Props) {
    const eligibleCommissions = getEligibleCommissions(commissions, startDate)
    const selectedCount = eligibleCommissions.filter((commission) => value.includes(commission.id)).length

    return <div className={showHeader ? 'eligible-commissions' : 'eligible-commissions standalone'}>
        {showHeader && <div><strong>Comisiones incluidas</strong><span>{selectedCount} de {eligibleCommissions.length} seleccionadas</span></div>}
        {eligibleCommissions.map((commission) => <label className="eligible-commission-row" key={commission.id}>
            <input name="enrollmentCommissions" type="checkbox" checked={value.includes(commission.id)} onChange={(event) => onChange(event.target.checked ? [...value, commission.id] : value.filter((id) => id !== commission.id))} />
            <span>
                <strong>{commission.name}</strong>
                <small><Clock3 size={13} />{commission.schedule} · {commission.studentsCount}/{commission.capacity} alumnos</small>
                <small><CalendarDays size={13} />Cursada del {formatShortDate(commission.startDate)} al {formatShortDate(commission.endDate)}</small>
            </span>
        </label>)}
        {eligibleCommissions.length === 0 && <p>No hay comisiones disponibles: todas están cerradas o terminaron antes del inicio de la inscripción.</p>}
        {eligibleCommissions.length > 0 && selectedCount === 0 && <p className="form-field-error">Seleccioná al menos una comisión para publicar la inscripción.</p>}
    </div>
}
