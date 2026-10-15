import type { FormValidationResult } from './formValidation'

// Same treatment EntityFormModal applies on submit, for forms that live inline on a page: clear the
// previous marks, outline every invalid [name] field, focus the first one and return the messages.
export function markInvalidFields(container: HTMLElement | null, result: FormValidationResult): string {
    const fields = Array.from(container?.querySelectorAll<HTMLElement>('[name]') ?? [])
    fields.forEach((field) => field.classList.remove('field-invalid'))
    if (result.valid) return ''
    const invalidKeys = Object.keys(result.fieldErrors ?? {})
    invalidKeys.forEach((key) => fields.find((field) => field.getAttribute('name') === key)?.classList.add('field-invalid'))
    fields.find((field) => field.getAttribute('name') === invalidKeys[0])?.focus()
    const messages = invalidKeys.map((key) => result.fieldErrors?.[key]).filter((message): message is string => Boolean(message))
    return messages.length > 0 ? messages.join(' ') : result.message ?? 'Revisá los campos obligatorios.'
}
