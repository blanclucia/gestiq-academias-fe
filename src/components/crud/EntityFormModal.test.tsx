// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { invalidForm } from '@/components/forms/formValidation'
import { DeleteConfirmationModal, EntityFormModal, FormField } from './EntityFormModal'

afterEach(cleanup)

describe('EntityFormModal validation', () => {
    it('shows the specific field error (not the generic summary), focuses the first invalid field and blocks submit', () => {
        const onSubmit = vi.fn()
        render(
            <EntityFormModal open title="Formulario" onClose={() => undefined} onSubmit={onSubmit} validate={() => invalidForm('Revisá los datos.', { email: 'Email inválido.' })}>
                <FormField label="Email"><input name="email" /></FormField>
            </EntityFormModal>,
        )
        fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
        expect(screen.getByRole('alert')).toHaveTextContent('Email inválido.')
        expect(screen.getByRole('textbox')).toHaveFocus()
        expect(screen.getByRole('textbox')).toHaveClass('field-invalid')
        expect(onSubmit).not.toHaveBeenCalled()
    })

    it('falls back to the generic summary when no field-specific messages are available', () => {
        const onSubmit = vi.fn()
        render(
            <EntityFormModal open title="Formulario" onClose={() => undefined} onSubmit={onSubmit} validate={() => ({ valid: false, message: 'Revisá los datos.' })}>
                <FormField label="Email"><input name="email" /></FormField>
            </EntityFormModal>,
        )
        fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
        expect(screen.getByRole('alert')).toHaveTextContent('Revisá los datos.')
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

describe('modal actions that save to the backend', () => {
    it('disables the button while saving and shows the error, staying open, when the save fails', async () => {
        let fail: (reason: Error) => void = () => undefined
        const onSubmit = vi.fn(() => new Promise((_resolve, reject) => { fail = reject }))
        render(<EntityFormModal open title="Editar cobro" submitErrorMessage="No se pudo guardar el cobro." onClose={vi.fn()} onSubmit={onSubmit}><p>contenido</p></EntityFormModal>)
        fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
        expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled()
        fail(new Error('conflict'))
        expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar el cobro.')
        expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled()
    })

    it('lets a confirmation fail without closing', async () => {
        const onClose = vi.fn()
        render(<DeleteConfirmationModal open title="Eliminar egreso" description="Se eliminará." onClose={onClose} onConfirm={() => Promise.reject(new Error('down'))} />)
        fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se pudo completar la acción.'))
        expect(onClose).not.toHaveBeenCalled()
    })
})
