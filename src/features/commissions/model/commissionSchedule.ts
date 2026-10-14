// A commission's schedule is persisted as display text, e.g. "Lun / Mié · 18:30 - 20:00".
// Both directions live here so the edit form always reads back exactly what the create form wrote.

export const commissionWeekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export const defaultCommissionTimes = { fromTime: '18:30', toTime: '20:00' }

export type CommissionSchedule = { days: string[]; fromTime: string; toTime: string }

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function formatCommissionSchedule({ days, fromTime, toTime }: CommissionSchedule) {
    const dayLabels = commissionWeekDays.filter((day) => days.includes(day)).map((day) => day.slice(0, 3)).join(' / ')
    return `${dayLabels || 'Horario a definir'} · ${fromTime} - ${toTime}`
}

export function parseCommissionSchedule(schedule: string | undefined): CommissionSchedule {
    const [daysPart = '', timePart = ''] = (schedule ?? '').split('·').map((part) => part.trim())
    // Match whole tokens ("Mar", "Mié", "Mie"…) instead of substrings, so "Horario a definir" never reads as a day.
    const tokens = daysPart.split('/').map((token) => normalize(token.trim()))
    const days = commissionWeekDays.filter((day) => tokens.includes(normalize(day.slice(0, 3))))
    const times = (timePart || daysPart).match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/)
    return { days, fromTime: times?.[1] ?? defaultCommissionTimes.fromTime, toTime: times?.[2] ?? defaultCommissionTimes.toTime }
}
