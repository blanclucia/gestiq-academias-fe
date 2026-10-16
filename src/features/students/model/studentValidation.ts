import { invalidForm, validForm, type FormValidationResult } from '@/components/forms/formValidation'
import { isValidBirthDate, isValidDni, isValidEmail, isValidPersonName, isValidPhone, normalizeDocument } from '@/domain/people/personRules'
import type { StudentFormValue } from '../components/StudentForm'

export function validateStudent(value: StudentFormValue): FormValidationResult {
    const errors: Record<string, string> = {}
    // Same rules as the backend and the public enrollment form (domain/people).
    const document = normalizeDocument(value.document)
    if (!value.firstName.trim()) errors.studentFirstName = 'Ingresá el nombre.'
    else if (!isValidPersonName(value.firstName.trim())) errors.studentFirstName = 'El nombre solo puede tener letras.'
    if (!value.lastName.trim()) errors.studentLastName = 'Ingresá el apellido.'
    else if (!isValidPersonName(value.lastName.trim())) errors.studentLastName = 'El apellido solo puede tener letras.'
    if (!document) errors.studentDocument = 'Ingresá el documento.'
    else if (!isValidDni(document)) errors.studentDocument = 'El DNI tiene que tener 7 u 8 números.'
    if (value.email && !isValidEmail(value.email.trim())) errors.studentEmail = 'Ingresá un email válido.'
    if (value.phone.trim() && !isValidPhone(value.phone.trim())) errors.studentPhone = 'El teléfono tiene que tener entre 8 y 15 números.'
    if (value.birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(value.birthDate)) errors.studentBirthDate = 'Usá el formato aaaa-mm-dd.'
    else if (value.birthDate && !isValidBirthDate(value.birthDate)) errors.studentBirthDate = 'Revisá la fecha de nacimiento.'
    return Object.keys(errors).length ? invalidForm('Revisá los datos del alumno.', errors) : validForm
}

export type StudentDetailValue = StudentFormValue & { tutorName: string; tutorEmail: string; tutorPhone: string }

// The detail also edits the tutor: optional fields, validated with the same people rules when typed.
export function validateStudentDetail(value: StudentDetailValue): FormValidationResult {
    const base = validateStudent(value)
    const errors: Record<string, string> = { ...(base.fieldErrors ?? {}) }
    if (value.tutorName.trim() && !isValidPersonName(value.tutorName.trim())) errors.studentTutorName = 'El nombre del tutor solo puede tener letras.'
    if (value.tutorEmail.trim() && !isValidEmail(value.tutorEmail.trim())) errors.studentTutorEmail = 'Ingresá un email válido para el tutor.'
    if (value.tutorPhone.trim() && !isValidPhone(value.tutorPhone.trim())) errors.studentTutorPhone = 'El teléfono del tutor tiene que tener entre 8 y 15 números.'
    return Object.keys(errors).length ? invalidForm('Revisá los datos del alumno.', errors) : validForm
}
