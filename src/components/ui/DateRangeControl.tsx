export type DateRangeValue = {
    from: string
    to: string
}

type DateRangeControlProps = {
    value: DateRangeValue
    onChange: (value: DateRangeValue) => void
    ariaLabel?: string
}

export function DateRangeControl({ value, onChange, ariaLabel = 'Rango de fechas' }: DateRangeControlProps) {
    return (
        <div className="toolbar-date-range" aria-label={ariaLabel}>
            <input className="form-input" type="date" aria-label="Fecha desde" value={value.from} onChange={(event) => onChange({ ...value, from: event.target.value })} />
            <input className="form-input" type="date" aria-label="Fecha hasta" value={value.to} onChange={(event) => onChange({ ...value, to: event.target.value })} />
        </div>
    )
}
