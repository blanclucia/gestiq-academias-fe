// Rules for a person's identifying data, mirrored from the backend (internal/domain/people) so the
// public enrollment form and the student forms warn before submitting what the API would reject.

// Connectors stay lowercase inside a name: "María de la Fuente".
const connectors = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'da', 'das', 'do', 'dos', 'di', 'van', 'von', 'der'])

// "LUcia BLANC" → "Lucia Blanc"; each part of a hyphenated or apostrophized word is capitalized
// ("ana-laura d'angelo" → "Ana-Laura D'Angelo"). The backend stores names this way.
export function normalizePersonName(value: string) {
    return value.trim().split(/\s+/).filter(Boolean).map((word, index) => {
        const lower = word.toLocaleLowerCase('es-AR')
        if (index > 0 && connectors.has(lower)) return lower
        return lower.replace(/(^|[-'’])(\p{L})/gu, (_match, separator: string, letter: string) => `${separator}${letter.toLocaleUpperCase('es-AR')}`)
    }).join(' ')
}

// Letters (accents included), spaces, hyphens, apostrophes and dots, with at least one letter.
export function isValidPersonName(value: string) {
    return /^[\p{L} .'’-]+$/u.test(value) && /\p{L}/u.test(value) && value.length <= 160
}

// "30.111.222" → "30111222": the same person is always found by the same document.
export function normalizeDocument(value: string) {
    return value.replace(/[.\s]/g, '')
}

export function isValidDni(value: string) {
    return /^\d{7,8}$/.test(value)
}

// "+54 9 341 555-1234", "(0341) 4555123": digits plus + ( ) - and spaces, 8 to 15 digits.
export function isValidPhone(value: string) {
    if (!/^\+?[\d\s()-]+$/.test(value)) return false
    const digits = value.replace(/\D/g, '').length
    return digits >= 8 && digits <= 15
}

export function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export const maxAge = 100

const isoDay = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

// Not in the future nor more than maxAge years ago (catches 1826 typed for 1986).
export function isValidBirthDate(value: string, today = new Date()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const oldest = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate())
    return value <= isoDay(today) && value >= isoDay(oldest)
}
