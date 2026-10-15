// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SearchableSelect } from './SearchableSelect'

afterEach(cleanup)

const options = [{ value: 's1', label: 'Lucía Blanc' }, { value: 's2', label: 'Ana Pérez' }]

describe('SearchableSelect clearable', () => {
    it('lets a pick made by mistake be removed', () => {
        const onChange = vi.fn()
        render(<SearchableSelect value="s1" options={options} onChange={onChange} clearable clearLabel="Quitar alumno" />)
        fireEvent.click(screen.getByRole('button', { name: 'Quitar alumno' }))
        expect(onChange).toHaveBeenCalledWith('')
    })

    it('shows no clear button without a selection or when not clearable', () => {
        const { rerender } = render(<SearchableSelect value="" options={options} onChange={vi.fn()} clearable />)
        expect(screen.queryByRole('button', { name: 'Quitar selección' })).not.toBeInTheDocument()
        rerender(<SearchableSelect value="s1" options={options} onChange={vi.fn()} />)
        expect(screen.queryByRole('button', { name: 'Quitar selección' })).not.toBeInTheDocument()
    })
})
