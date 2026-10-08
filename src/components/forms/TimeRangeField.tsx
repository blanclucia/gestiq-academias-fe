import { SearchableSelect } from '@/components/ui/SearchableSelect'

type TimeRangeFieldProps = {
    fromTime: string
    toTime: string
    onFromTimeChange: (value: string) => void
    onToTimeChange: (value: string) => void
    fromName?: string
    toName?: string
}

const timeOptions = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map((time) => ({ value: time, label: time }))

export function TimeRangeField({ fromTime, toTime, onFromTimeChange, onToTimeChange, fromName, toName }: TimeRangeFieldProps) {
    return (
        <div className="time-range-group">
            <SearchableSelect className="time-range-select" name={fromName} aria-label="Desde" value={fromTime} onChange={onFromTimeChange} options={timeOptions} />
            <span className="time-range-separator">a</span>
            <SearchableSelect className="time-range-select" name={toName} aria-label="Hasta" value={toTime} onChange={onToTimeChange} options={timeOptions} />
        </div>
    )
}
