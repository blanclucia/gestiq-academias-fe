import { invalidForm, validForm, type FormValidationResult } from '@/components/forms/formValidation'
import type { StudentFormValue } from '../components/StudentForm'

export function validateStudent(value: StudentFormValue): FormValidationResult {
    const errors: Record<string, string> = {}
    if (!value.firstName.trim()) errors.studentFirstName = 'Ingresá el nombre.'
    if (!value.lastName.trim()) errors.studentLastName = 'Ingresá el apellido.'
    if (!value.document.trim()) errors.studentDocument = 'Ingresá el documento.'
    if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) errors.studentEmail = 'Ingresá un email válido.'
    if (value.birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(value.birthDate)) errors.studentBirthDate = 'Usá el formato aaaa-mm-dd.'
    return Object.keys(errors).length ? invalidForm('Revisá los datos del alumno.', errors) : validForm
}
