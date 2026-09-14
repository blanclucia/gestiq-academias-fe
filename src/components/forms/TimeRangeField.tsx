type TimeRangeFieldProps = {
    fromTime: string
    toTime: string
    onFromTimeChange: (value: string) => void
    onToTimeChange: (value: string) => void
    fromName?: string
    toName?: string
}

const timeOptions = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']

export function TimeRangeField({ fromTime, toTime, onFromTimeChange, onToTimeChange, fromName, toName }: TimeRangeFieldProps) {
    return (
        <div className="time-range-group">
            <select name={fromName} className="form-input time-range-select" value={fromTime} onChange={(event) => onFromTimeChange(event.target.value)} aria-label="Desde">
                {timeOptions.map((time) => (
                    <option key={time} value={time}>
                        {time}
                    </option>
                ))}
            </select>
            <span className="time-range-separator">a</span>
            <select name={toName} className="form-input time-range-select" value={toTime} onChange={(event) => onToTimeChange(event.target.value)} aria-label="Hasta">
                {timeOptions.map((time) => (
                    <option key={time} value={time}>
                        {time}
                    </option>
                ))}
            </select>
        </div>
    )
}
