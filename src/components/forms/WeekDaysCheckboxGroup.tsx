type WeekDaysCheckboxGroupProps = {
    value: string[]
    onChange: (value: string[]) => void
    days?: string[]
    name?: string
}

const defaultDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function WeekDaysCheckboxGroup({ value, onChange, days = defaultDays, name }: WeekDaysCheckboxGroupProps) {
    const toggleDay = (day: string) => {
        onChange(value.includes(day) ? value.filter((item) => item !== day) : [...value, day])
    }

    return (
        <div className="day-chip-group">
            {days.map((day) => (
                <label key={day} className="day-chip-option">
                    <input name={name} type="checkbox" checked={value.includes(day)} onChange={() => toggleDay(day)} />
                    <span>{day}</span>
                </label>
            ))}
        </div>
    )
}
