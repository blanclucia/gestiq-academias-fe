export function calculateAge(birthDate: string, today = new Date()) {
    const birth = new Date(`${birthDate}T12:00:00`)
    if (Number.isNaN(birth.getTime())) return null
    let age = today.getFullYear() - birth.getFullYear()
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age -= 1
    return age
}

export function isMinor(birthDate?: string, today = new Date()) {
    if (!birthDate) return false
    const age = calculateAge(birthDate, today)
    return age !== null && age < 18
}
