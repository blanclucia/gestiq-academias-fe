export function calculateOccupancy(assignedStudents: number, capacity: number) {
    if (!Number.isFinite(assignedStudents) || !Number.isFinite(capacity) || capacity <= 0) return 0
    return Math.round((Math.max(0, assignedStudents) / capacity) * 100)
}

type SchedulableCommission = { id: string; status: string; startDate: string; endDate: string }

// A commission can take enrollments if it isn't closed and hasn't finished before the enrollment
// opens. It may start after the enrollment closes: enrolling ahead of a later commission (open in
// September for October and November) is the common case. Same rule as the backend.
export function getEligibleCommissions<T extends SchedulableCommission>(commissions: T[], enrollmentStartDate: string, selectedIds?: string[]) {
    return commissions.filter((commission) => commission.status !== 'Cerrada' && commission.endDate >= enrollmentStartDate && (!selectedIds || selectedIds.includes(commission.id)))
}
