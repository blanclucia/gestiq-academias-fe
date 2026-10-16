import { describe, expect, it } from 'vitest'
import { validateStudent } from './studentValidation'

const empty = { firstName: '', lastName: '', document: '', email: '', phone: '', birthDate: '', status: 'Activo' as const, notes: '', tutorName: '', tutorEmail: '', tutorPhone: '' }
const adult = { ...empty, firstName: 'Lucía', lastName: 'Gómez', document: '32108901', birthDate: '1995-05-10' }
const tenYearsAgo = () => { const date = new Date(); date.setFullYear(date.getFullYear() - 10); return date.toLocaleDateString('sv-SE') }

describe('student validation', () => {
    it('reports required and formatted fields', () => {
        expect(validateStudent({ ...empty, email: 'bad', birthDate: '01/01/2010' }).fieldErrors).toMatchObject({ studentFirstName: expect.any(String), studentEmail: expect.any(String), studentBirthDate: expect.any(String) })
    })

    it('asks a minor for a tutor with a way to reach them, like the public form', () => {
        const minor = { ...adult, birthDate: tenYearsAgo() }
        expect(Object.keys(validateStudent(minor).fieldErrors ?? {})).toEqual(['studentTutorName', 'studentTutorPhone'])
        expect(validateStudent({ ...minor, tutorName: 'María Gómez', tutorPhone: '341 555-1234' }).valid).toBe(true)
        expect(validateStudent(adult).valid).toBe(true)
    })
})
