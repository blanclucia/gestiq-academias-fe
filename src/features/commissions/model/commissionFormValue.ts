import type { AcademicCommission } from '@/services/academyRepository'
import type { CommissionFormValue } from '../components/CommissionForm'
import { parseCommissionSchedule } from './commissionSchedule'

export function toCommissionFormValue(commission: AcademicCommission): CommissionFormValue {
    return {
        name: commission.name,
        teachers: commission.teachers,
        capacity: commission.capacity,
        amount: commission.amount,
        startDate: commission.startDate,
        endDate: commission.endDate,
        dueDay: commission.dueDay,
        status: commission.status,
        ...parseCommissionSchedule(commission.schedule),
    }
}
