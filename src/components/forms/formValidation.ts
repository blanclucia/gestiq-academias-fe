export type FormValidationResult = {
    valid: boolean
    message?: string
    fieldErrors?: Record<string, string>
}

export const validForm: FormValidationResult = { valid: true }

export function invalidForm(message: string, fieldErrors?: Record<string, string>): FormValidationResult {
    return { valid: false, message, fieldErrors }
}

export function validateConditions(conditions: Record<string, string | false>, message = 'Revisá los campos obligatorios.'): FormValidationResult {
    const fieldErrors = Object.fromEntries(Object.entries(conditions).filter((entry): entry is [string, string] => Boolean(entry[1])))
    return Object.keys(fieldErrors).length ? invalidForm(message, fieldErrors) : validForm
}
