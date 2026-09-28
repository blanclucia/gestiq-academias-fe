const WEEKDAY_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export function weekDaysToOperating(weekDays: string[]): number[] {
    return [...new Set(weekDays.map((day) => WEEKDAY_ORDER.indexOf(day) + 1).filter((day) => day > 0))].sort((a, b) => a - b)
}

export function operatingToWeekDays(operatingWeekdays: number[]): string[] {
    return operatingWeekdays.map((day) => WEEKDAY_ORDER[day - 1]).filter((day): day is string => Boolean(day))
}

export function branchStatusToApi(status: 'Activa' | 'Inactiva'): 'active' | 'inactive' {
    return status === 'Activa' ? 'active' : 'inactive'
}

export function branchStatusFromApi(status: 'active' | 'inactive'): 'Activa' | 'Inactiva' {
    return status === 'active' ? 'Activa' : 'Inactiva'
}

// The backend requires a unique displayCode per branch (regex ^[A-Z0-9][A-Z0-9_-]{0,31}$).
// The current UI has no field for it, so it's derived from the name plus a time-based suffix to avoid collisions.
export function generateDisplayCode(name: string): string {
    const base = name
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 24)
    const suffix = Date.now().toString(36).toUpperCase().slice(-6)
    return `${base || 'SEDE'}_${suffix}`.slice(0, 32)
}
