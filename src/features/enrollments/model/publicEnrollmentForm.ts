import { validateConditions, type FormValidationResult } from '@/components/forms/formValidation'
import { isValidBirthDate, isValidDni, isValidEmail, isValidPersonName, isValidPhone, normalizeDocument } from '@/domain/people/personRules'

export type PublicEnrollmentFormValue = {
    firstName: string
    lastName: string
    document: string
    email: string
    phone: string
    birthDate: string
    address: string
    tutorName: string
    tutorEmail: string
    tutorPhone: string
    priorStudies: string
}

// Field keys are the inputs' names, so markInvalidFields can outline them. `required` holds the labels
// marked as mandatory in Mi academia → Inscripciones ("Email", "Teléfono", "Fecha de nacimiento",
// "Dirección"); the DNI is always required because the student is identified by it. The backend
// applies the same rules (ValidateRegistration).
export function validateStudentStep(form: PublicEnrollmentFormValue, required: Set<string>, today = new Date()): FormValidationResult {
    const document = normalizeDocument(form.document)
    return validateConditions({
        firstName: !form.firstName.trim() ? 'Ingresá el nombre del alumno.' : !isValidPersonName(form.firstName.trim()) && 'El nombre solo puede tener letras.',
        lastName: !form.lastName.trim() ? 'Ingresá el apellido del alumno.' : !isValidPersonName(form.lastName.trim()) && 'El apellido solo puede tener letras.',
        document: !document ? 'Ingresá el DNI.' : !isValidDni(document) && 'El DNI tiene que tener 7 u 8 números.',
        birthDate: !form.birthDate
            ? required.has('Fecha de nacimiento') && 'Ingresá la fecha de nacimiento.'
            : !isValidBirthDate(form.birthDate, today) && 'Revisá la fecha de nacimiento.',
    }, 'Revisá los datos del alumno.')
}

// A minor's required email and phone are the tutor's; their own become optional.
export function validateContactStep(form: PublicEnrollmentFormValue, required: Set<string>, isMinor: boolean): FormValidationResult {
    const email = (value: string, missing: string | false) => !value.trim() ? missing : !isValidEmail(value.trim()) && 'Revisá el email ingresado.'
    const phone = (value: string, missing: string | false) => !value.trim() ? missing : !isValidPhone(value.trim()) && 'El teléfono tiene que tener entre 8 y 15 números.'
    return validateConditions({
        tutorName: isMinor && (!form.tutorName.trim() ? 'Ingresá el nombre del tutor.' : !isValidPersonName(form.tutorName.trim()) && 'El nombre del tutor solo puede tener letras.'),
        tutorEmail: isMinor && email(form.tutorEmail, required.has('Email') && 'Ingresá el email del tutor.'),
        tutorPhone: isMinor && phone(form.tutorPhone, required.has('Teléfono') && 'Ingresá el teléfono del tutor.'),
        email: email(form.email, !isMinor && required.has('Email') && 'Ingresá un email de contacto.'),
        phone: phone(form.phone, !isMinor && required.has('Teléfono') && 'Ingresá un teléfono de contacto.'),
        address: required.has('Dirección') && !form.address.trim() && 'Ingresá la dirección.',
    }, 'Revisá los datos de contacto.')
}

const studentStepFields = new Set(['firstName', 'lastName', 'document', 'birthDate'])

// Which step holds a field the backend rejected, to send the visitor back there.
export function stepOfField(field: string): 1 | 2 {
    return studentStepFields.has(field) ? 1 : 2
}

const backendFieldMessages: Record<string, string> = {
    firstName: 'Revisá el nombre del alumno.',
    lastName: 'Revisá el apellido del alumno.',
    document: 'Revisá el DNI: tiene que tener 7 u 8 números.',
    birthDate: 'Revisá la fecha de nacimiento.',
    email: 'Revisá el email de contacto.',
    phone: 'Revisá el teléfono de contacto.',
    address: 'Ingresá la dirección.',
    tutorName: 'Revisá el nombre del tutor.',
    tutorEmail: 'Revisá el email del tutor.',
    tutorPhone: 'Revisá el teléfono del tutor.',
}

const backendCodeMessages: Record<string, string> = {
    no_capacity: 'La comisión elegida ya no tiene lugares. Elegí otra comisión.',
    commission_not_eligible: 'La comisión elegida ya no está disponible. Elegí otra comisión.',
    enrollment_not_open: 'La inscripción ya no está abierta.',
    course_not_active: 'El curso ya no está disponible para inscribirse.',
    cycle_not_active: 'El curso ya no está disponible para inscribirse.',
}

// Turns a backend rejection into something the visitor can act on, instead of a generic error.
export function describeRegistrationError(error: unknown): { message: string; fieldErrors?: Record<string, string> } {
    const apiError = error as { code?: string; fields?: Record<string, string> } | null
    const fields = Object.keys(apiError?.fields ?? {}).filter((field) => backendFieldMessages[field])
    if (fields.length > 0) {
        const fieldErrors = Object.fromEntries(fields.map((field) => [field, backendFieldMessages[field]]))
        return { message: Object.values(fieldErrors).join(' '), fieldErrors }
    }
    return { message: (apiError?.code && backendCodeMessages[apiError.code]) || 'No pudimos completar la inscripción. Intentá nuevamente.' }
}
