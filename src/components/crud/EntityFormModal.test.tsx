// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { invalidForm } from '@/components/forms/formValidation'
import { EntityFormModal, FormField } from './EntityFormModal'

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
        expect(onSubmit).not.toHaveBeenCalled()
    })
})
