import { describe, expect, it } from 'vitest'
import { describeRegistrationError, stepOfField, validateContactStep, validateStudentStep, type PublicEnrollmentFormValue } from './publicEnrollmentForm'

const form = (overrides: Partial<PublicEnrollmentFormValue> = {}): PublicEnrollmentFormValue => ({
    firstName: 'Lucía', lastName: 'Gómez', document: '32.108.901', email: 'lucia@example.com', phone: '341 555-1234', birthDate: '1995-05-10',
    address: '', tutorName: '', tutorEmail: '', tutorPhone: '', priorStudies: '', ...overrides,
})
const today = new Date(2026, 9, 16)

describe('public enrollment form', () => {
    it('accepts a DNI typed with dots and rejects malformed student data', () => {
        expect(validateStudentStep(form(), new Set(), today).valid).toBe(true)
        const result = validateStudentStep(form({ firstName: '123', document: '123', birthDate: '2027-01-01' }), new Set(), today)
        expect(Object.keys(result.fieldErrors ?? {})).toEqual(['firstName', 'document', 'birthDate'])
    })

    it('requires the DNI always and the birth date only when the academy asks for it', () => {
        expect(validateStudentStep(form({ document: '' }), new Set(), today).fieldErrors).toHaveProperty('document')
        expect(validateStudentStep(form({ birthDate: '' }), new Set(), today).valid).toBe(true)
        expect(validateStudentStep(form({ birthDate: '' }), new Set(['Fecha de nacimiento']), today).fieldErrors).toHaveProperty('birthDate')
    })

    it("asks a minor for the tutor's contact instead of their own", () => {
        const required = new Set(['Email', 'Teléfono'])
        const minor = form({ email: '', phone: '' })
        expect(Object.keys(validateContactStep(minor, required, true).fieldErrors ?? {})).toEqual(['tutorName', 'tutorEmail', 'tutorPhone'])
        expect(validateContactStep({ ...minor, tutorName: 'María Gómez', tutorEmail: 'maria@example.com', tutorPhone: '3415551234' }, required, true).valid).toBe(true)
        expect(Object.keys(validateContactStep(form({ email: 'mal', phone: 'asd' }), required, false).fieldErrors ?? {})).toEqual(['email', 'phone'])
    })

    it('explains backend rejections and points to the step of the field', () => {
        expect(describeRegistrationError({ code: 'validation', fields: { document: 'invalid' } }).fieldErrors).toHaveProperty('document')
        expect(stepOfField('document')).toBe(1)
        expect(stepOfField('phone')).toBe(2)
        expect(describeRegistrationError({ code: 'no_capacity' }).message).toContain('ya no tiene lugares')
        expect(describeRegistrationError(new Error('x')).message).toContain('No pudimos completar')
    })
})
