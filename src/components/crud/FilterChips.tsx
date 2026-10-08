import { X } from 'lucide-react'
import { joinFilterValue, splitFilterValue } from './filterValues'

type FilterChipsProps = {
    fields: { key: string; label: string }[]
    values: Record<string, string>
    onChange: (values: Record<string, string>) => void
}

// Shared "which filters are active" indicator — any screen with a filter modal (CrudListPage's
// built-in one, or a standalone FilterModal) renders this next to its "Filtros" trigger so the
// table never looks emptied out by a forgotten filter with no visible cause. A
// field can carry more than one picked value, so each one gets its own removable chip.
export function FilterChips({ fields, values, onChange }: FilterChipsProps) {
    const activeEntries = fields.flatMap((field) =>
        splitFilterValue(values[field.key]).map((value) => ({ field, value })),
    )

    if (activeEntries.length === 0) return null

    const removeValue = (fieldKey: string, value: string) => {
        const remaining = splitFilterValue(values[fieldKey]).filter((item) => item !== value)
        onChange({ ...values, [fieldKey]: joinFilterValue(remaining) })
    }

    return <div className="active-filters-inline">
        {activeEntries.map(({ field, value }) => (
            <button
                key={`${field.key}-${value}`}
                type="button"
                className="filter-chip"
                onClick={() => removeValue(field.key, value)}
                aria-label={`Quitar filtro ${field.label}: ${value}`}
            >
                {field.label}: {value}
                <X size={12} />
            </button>
        ))}
        {activeEntries.length > 1 && (
            <button
                type="button"
                className="filter-chip-clear"
                onClick={() => onChange(Object.fromEntries(fields.map((field) => [field.key, ''])))}
            >
                Limpiar todo
            </button>
        )}
    </div>
}
