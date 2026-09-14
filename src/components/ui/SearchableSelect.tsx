import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

export type SearchableSelectOption = {
    value: string
    label: string
}

type SearchableSelectProps = {
    value: string
    options: SearchableSelectOption[]
    onChange: (value: string) => void
    placeholder?: string
    emptyLabel?: string
}

export function SearchableSelect({ value, options, onChange, placeholder = 'Buscar...', emptyLabel = 'No hay opciones disponibles.' }: SearchableSelectProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const listboxId = `searchable-select-options-${useId()}`
    const selectedOption = options.find((option) => option.value === value)
    const [query, setQuery] = useState(selectedOption?.label ?? '')
    const [open, setOpen] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(0)

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
        }
        document.addEventListener('pointerdown', handlePointerDown)
        return () => document.removeEventListener('pointerdown', handlePointerDown)
    }, [])

    const filteredOptions = options.filter((option) => option.label.toLocaleLowerCase('es-AR').includes(query.toLocaleLowerCase('es-AR')))
    const selectOption = (option: SearchableSelectOption) => {
        onChange(option.value)
        setQuery(option.label)
        setOpen(false)
        setHighlightedIndex(0)
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
            selectOption(filteredOptions[highlightedIndex])
        } else if (event.key === 'Escape') {
            setOpen(false)
        }
    }

    return <div className="student-picker" ref={containerRef}>
        <input
            className="form-input"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setOpen(true); setHighlightedIndex(0) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            autoComplete="off"
        />
        {open && <div className="student-picker-options" id={listboxId} role="listbox">
            {filteredOptions.length > 0 ? filteredOptions.map((option, index) => <button key={option.value} type="button" role="option" aria-selected={option.value === value} className={index === highlightedIndex ? 'highlighted' : ''} onMouseEnter={() => setHighlightedIndex(index)} onClick={() => selectOption(option)}>{option.label}</button>) : <span className="student-picker-empty">{emptyLabel}</span>}
        </div>}
    </div>
}
