export function calculateOccupancy(assignedStudents: number, capacity: number) {
    if (!Number.isFinite(assignedStudents) || !Number.isFinite(capacity) || capacity <= 0) return 0
    return Math.round((Math.max(0, assignedStudents) / capacity) * 100)
}

type SchedulableCommission = { id: string; status: string; startDate: string; endDate: string }

export function getEligibleCommissions<T extends SchedulableCommission>(commissions: T[], startDate: string, endDate: string, selectedIds?: string[]) {
    return commissions.filter((commission) => commission.status !== 'Cerrada' && commission.startDate <= endDate && commission.endDate >= startDate && (!selectedIds || selectedIds.includes(commission.id)))
}
