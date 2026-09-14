type CommissionBillingPeriod = { startDate: string; endDate: string; dueDay: number }

export function getCommissionMonthlyDueDates(commission: CommissionBillingPeriod) {
    const [startYear, startMonth] = commission.startDate.split('-').map(Number)
    const [endYear, endMonth] = commission.endDate.split('-').map(Number)
    if (!startYear || !startMonth || !endYear || !endMonth || commission.endDate < commission.startDate) return []

    const dates: string[] = []
    let year = startYear
    let month = startMonth
    while (year < endYear || (year === endYear && month <= endMonth)) {
        const candidate = `${year}-${String(month).padStart(2, '0')}-${String(commission.dueDay).padStart(2, '0')}`
        dates.push(candidate < commission.startDate ? commission.startDate : candidate > commission.endDate ? commission.endDate : candidate)
        month += 1
        if (month === 13) { month = 1; year += 1 }
    }
    return dates
}

export function getInstallmentMonthLabel(date: string) {
    const [year, month] = date.split('-').map(Number)
    return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)))
}

export function splitInstallments(total: number, count: number) {
    if (!Number.isFinite(total) || total < 0 || !Number.isInteger(count) || count < 1) return []
    const regularAmount = Math.round(total / count)
    return Array.from({ length: count }, (_, index) => index === count - 1 ? total - regularAmount * (count - 1) : regularAmount)
}
