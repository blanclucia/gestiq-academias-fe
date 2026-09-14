export function addMonthsToDate(dateText: string, months: number) {
    const [year, month, day] = dateText.split('-').map(Number)
    if (!year || !month || !day) return dateText
    const date = new Date(year, month - 1 + months, 1)
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`
}

export function getLocalDateString(date = new Date()) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}
