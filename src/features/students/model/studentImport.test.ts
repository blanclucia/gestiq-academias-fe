import { describe, expect, it } from 'vitest'
import { parseStudentCsv, splitCsvLine, suggestStudentImportMapping } from './studentImport'

describe('student CSV import', () => {
    it('parses quoted commas and escaped quotes', () => {
        expect(splitCsvLine('Ana,"López, Díaz","Dice ""hola"""')).toEqual(['Ana', 'López, Díaz', 'Dice "hola"'])
    })

    it('maps localized and accented headers', () => {
        expect(suggestStudentImportMapping(['Nombre', 'Apellido', 'DNI', 'Teléfono'])).toMatchObject({ firstName: 'Nombre', lastName: 'Apellido', document: 'DNI', phone: 'Teléfono' })
    })

    it('reports an empty file', () => {
        expect(parseStudentCsv('\n ').fileError).toBe('El archivo esta vacio.')
    })
})
