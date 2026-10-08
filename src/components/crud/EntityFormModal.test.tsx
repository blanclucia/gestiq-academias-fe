// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { invalidForm } from '@/components/forms/formValidation'
import { EntityFormModal, FormField } from './EntityFormModal'

afterEach(cleanup)

describe('EntityFormModal validation', () => {
    it('shows the general error, focuses the first invalid field and blocks submit', () => {
        const onSubmit = vi.fn()
        render(
            <EntityFormModal open title="Formulario" onClose={() => undefined} onSubmit={onSubmit} validate={() => invalidForm('Revisá los datos.', { email: 'Email inválido.' })}>
                <FormField label="Email"><input name="email" /></FormField>
            </EntityFormModal>,
        )
        fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
        expect(screen.getByRole('alert')).toHaveTextContent('Revisá los datos.')
        expect(screen.getByRole('textbox')).toHaveFocus()
        expect(screen.getByRole('textbox')).toHaveClass('field-invalid')
        expect(onSubmit).not.toHaveBeenCalled()
    })

    it('only marks fields inside its own content, not same-named inputs elsewhere on the page', () => {
        const onSubmit = vi.fn()
        render(
            <>
                <input name="email" data-testid="outside-email" />
                <EntityFormModal open title="Formulario" onClose={() => undefined} onSubmit={onSubmit} validate={() => invalidForm('Revisá los datos.', { email: 'Email inválido.' })}>
                    <FormField label="Email"><input name="email" data-testid="inside-email" /></FormField>
                </EntityFormModal>
            </>,
        )
        fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
        expect(screen.getByTestId('inside-email')).toHaveClass('field-invalid')
        expect(screen.getByTestId('inside-email')).toHaveFocus()
        expect(screen.getByTestId('outside-email')).not.toHaveClass('field-invalid')
    })
})
