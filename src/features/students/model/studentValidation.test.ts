import { describe, expect, it } from 'vitest'
import { validateStudent } from './studentValidation'

describe('student validation', () => {
    it('reports required and formatted fields', () => {
        expect(validateStudent({ firstName: '', lastName: '', document: '', email: 'bad', phone: '', birthDate: '01/01/2010', status: 'Activo', notes: '' }).fieldErrors).toMatchObject({ studentFirstName: expect.any(String), studentEmail: expect.any(String), studentBirthDate: expect.any(String) })
    })
})
