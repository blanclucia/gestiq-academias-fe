import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

export type SearchableSelectOption = {
    value: string
    label: string
    disabled?: boolean
}

type SearchableSelectProps = {
    value: string
    options: SearchableSelectOption[]
    onChange: (value: string) => void
    placeholder?: string
    emptyLabel?: string
    // Lets a form's validate()/EntityFormModal focus-and-highlight mechanism find this field like
    // any plain input — without it, a required SearchableSelect fails validation silently.
    name?: string
    disabled?: boolean
    'aria-label'?: string
    // Extra class on the wrapper — used to carry layout rules (fixed width, etc.) that previously
    // targeted a plain <select> directly, since the real input now sits one level deeper.
    className?: string
}

export function SearchableSelect({ value, options, onChange, placeholder = 'Buscar...', emptyLabel = 'No hay opciones disponibles.', name, disabled = false, 'aria-label': ariaLabel, className = '' }: SearchableSelectProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const listboxId = `searchable-select-options-${useId()}`
    const selectedOption = options.find((option) => option.value === value)
    const [query, setQuery] = useState(selectedOption?.label ?? '')
    const [open, setOpen] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(0)
    // Kept fresh every render so the outside-click handler below (subscribed once, on mount) always
    // restores the CURRENT selection's label instead of a stale one from whenever it first ran.
    const selectedLabelRef = useRef(selectedOption?.label ?? '')
    useEffect(() => {
        selectedLabelRef.current = selectedOption?.label ?? ''
    })

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setOpen(false)
                // Without a pick, the box should go back to showing the real selection (or blank
                // for "Todas") instead of staying on whatever the user typed to search with.
                setQuery(selectedLabelRef.current)
            }
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

    return <div className={`student-picker${disabled ? ' disabled' : ''}${className ? ` ${className}` : ''}`} ref={containerRef}>
        <input
            name={name}
            aria-label={ariaLabel}
            className="form-input"
            value={query}
            disabled={disabled}
            onChange={(event) => { setQuery(event.target.value); setOpen(true); setHighlightedIndex(0) }}
            // Clear the query on focus so the full option list shows right away — otherwise it's
            // pre-filtered down to whatever currently matches the selected label (often showing
            // just that one option, or none, looking like the list never loaded).
            onFocus={() => { setOpen(true); setQuery('') }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            autoComplete="off"
        />
        {open && !disabled && <div className="student-picker-options" id={listboxId} role="listbox">
            {filteredOptions.length > 0 ? filteredOptions.map((option, index) => <button key={option.value} type="button" role="option" aria-selected={option.value === value} disabled={option.disabled} className={index === highlightedIndex ? 'highlighted' : ''} onMouseEnter={() => setHighlightedIndex(index)} onClick={() => selectOption(option)}>{option.label}</button>) : <span className="student-picker-empty">{emptyLabel}</span>}
        </div>}
    </div>
}
