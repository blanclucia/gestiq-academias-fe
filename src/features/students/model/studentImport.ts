export type ImportStudentRow = {
    rowNumber: number
    firstName: string
    lastName: string
    document: string
    email: string
    phone: string
    birthDate?: string
    errors: string[]
}

export type ImportFieldKey = 'firstName' | 'lastName' | 'document' | 'email' | 'phone' | 'birthDate'

export const csvHeaders = ['firstName', 'lastName', 'document', 'email', 'phone', 'birthDate']
export const requiredImportFields: ImportFieldKey[] = ['firstName', 'lastName', 'document']
export const importFieldLabels: Record<ImportFieldKey, string> = {
    firstName: 'Nombre *', lastName: 'Apellido *', document: 'Documento *', email: 'Email', phone: 'Telefono', birthDate: 'Fecha de nacimiento',
}

export function splitCsvLine(line: string) {
    const values: string[] = []
    let current = ''
    let inQuotes = false
    for (let index = 0; index < line.length; index += 1) {
        const char = line[index]
        if (char === '"') {
            if (inQuotes && line[index + 1] === '"') { current += '"'; index += 1 } else inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) { values.push(current.trim()); current = '' } else current += char
    }
    values.push(current.trim())
    return values
}

function normalizeHeader(value: string) {
    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
}

export function suggestStudentImportMapping(headers: string[]) {
    const aliases: Record<ImportFieldKey, string[]> = {
        firstName: ['firstname', 'nombre', 'nombres', 'alumno'], lastName: ['lastname', 'apellido', 'apellidos'],
        document: ['document', 'documento', 'dni', 'cedula'], email: ['email', 'mail', 'correoelectronico'],
        phone: ['phone', 'telefono', 'celular', 'movil'], birthDate: ['birthdate', 'fechanacimiento', 'nacimiento'],
    }
    const normalizedHeaders = headers.map((raw) => ({ raw, normalized: normalizeHeader(raw) }))
    return (Object.keys(importFieldLabels) as ImportFieldKey[]).reduce<Record<ImportFieldKey, string>>((mapping, key) => {
        mapping[key] = normalizedHeaders.find((item) => aliases[key].includes(item.normalized))?.raw ?? ''
        return mapping
    }, { firstName: '', lastName: '', document: '', email: '', phone: '', birthDate: '' })
}

export function parseStudentCsv(csvContent: string) {
    const lines = csvContent.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    if (lines.length === 0) return { headers: [] as string[], rows: [] as string[][], fileError: 'El archivo esta vacio.' }
    return { headers: splitCsvLine(lines[0]), rows: lines.slice(1).map(splitCsvLine), fileError: '' }
}
