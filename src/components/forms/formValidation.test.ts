import { describe, expect, it } from 'vitest'
import { invalidForm, validForm, validateConditions } from './formValidation'

describe('form validation contract', () => {
    it('represents valid and field-level invalid results consistently', () => {
        expect(validForm).toEqual({ valid: true })
        expect(invalidForm('Revisá el formulario.', { email: 'Email inválido.' })).toEqual({
            valid: false,
            message: 'Revisá el formulario.',
            fieldErrors: { email: 'Email inválido.' },
        })
    })

    it('builds field errors from failed conditions', () => {
        expect(validateConditions({ name: 'Ingresá el nombre.', email: false })).toMatchObject({ valid: false, fieldErrors: { name: 'Ingresá el nombre.' } })
    })
})
