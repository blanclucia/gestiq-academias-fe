import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import type { SearchableSelectOption } from './SearchableSelect'

type MultiSearchableSelectProps = {
    values: string[]
    options: SearchableSelectOption[]
    onChange: (values: string[]) => void
    placeholder?: string
    emptyLabel?: string
}

// Same searchable combobox as SearchableSelect, but picking an option toggles it into/out of a set
// instead of replacing the current value and closing — for filters, where "Inglés y Francés" is a
// valid thing to ask for, not just one or the other.
export function MultiSearchableSelect({ values, options, onChange, placeholder = 'Buscar...', emptyLabel = 'No hay opciones disponibles.' }: MultiSearchableSelectProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const listboxId = `multi-searchable-select-options-${useId()}`
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(0)

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setOpen(false)
                setQuery('')
            }
        }
        document.addEventListener('pointerdown', handlePointerDown)
        return () => document.removeEventListener('pointerdown', handlePointerDown)
    }, [])

    const filteredOptions = options.filter((option) => option.label.toLocaleLowerCase('es-AR').includes(query.toLocaleLowerCase('es-AR')))
    const toggleOption = (option: SearchableSelectOption) => {
        onChange(values.includes(option.value) ? values.filter((value) => value !== option.value) : [...values, option.value])
    }
    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault()
            setOpen(true)
            setHighlightedIndex((current) => Math.min(current + 1, Math.max(filteredOptions.length - 1, 0)))
        } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setOpen(true)
            setHighlightedIndex((current) => Math.max(current - 1, 0))
        } else if (event.key === 'Enter' && open && filteredOptions[highlightedIndex]) {
            event.preventDefault()
            toggleOption(filteredOptions[highlightedIndex])
        } else if (event.key === 'Escape') {
            setOpen(false)
        }
    }

    const selectedLabels = values.map((value) => options.find((option) => option.value === value)?.label ?? value)
    // Shows the picks while closed (so the field is self-explanatory without opening it), and a
    // plain search query while the dropdown is open and the user is actively typing.
    const displayValue = open ? query : selectedLabels.join(', ')

    return <div className="student-picker" ref={containerRef}>
        <input
            className="form-input"
            value={displayValue}
            onChange={(event) => { setQuery(event.target.value); setOpen(true); setHighlightedIndex(0) }}
            onFocus={() => { setOpen(true); setQuery('') }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            autoComplete="off"
        />
        {open && <div className="student-picker-options" id={listboxId} role="listbox">
            {filteredOptions.length > 0 ? filteredOptions.map((option, index) => (
                <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={values.includes(option.value)}
                    className={index === highlightedIndex ? 'highlighted' : ''}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => toggleOption(option)}
                >
                    {option.label}
                </button>
            )) : <span className="student-picker-empty">{emptyLabel}</span>}
        </div>}
    </div>
}
