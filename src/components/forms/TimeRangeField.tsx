import { SearchableSelect } from '@/components/ui/SearchableSelect'

type TimeRangeFieldProps = {
    fromTime: string
    toTime: string
    onFromTimeChange: (value: string) => void
    onToTimeChange: (value: string) => void
    fromName?: string
    toName?: string
}

// Every 30 minutes, 08:00–22:00 — schedules like 18:30–20:00 are common and must be selectable.
const baseTimes = Array.from({ length: 29 }, (_, index) => `${String(8 + Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`)

// A saved time outside the grid (e.g. 07:45) must still show up as the selected value instead of a blank box.
function timeOptionsFor(value: string) {
    const times = value && !baseTimes.includes(value) ? [...baseTimes, value].sort() : baseTimes
    return times.map((time) => ({ value: time, label: time }))
}

export function TimeRangeField({ fromTime, toTime, onFromTimeChange, onToTimeChange, fromName, toName }: TimeRangeFieldProps) {
    return (
        <div className="time-range-group">
            <SearchableSelect className="time-range-select" name={fromName} aria-label="Desde" placeholder="hh:mm" value={fromTime} onChange={onFromTimeChange} options={timeOptionsFor(fromTime)} />
            <span className="time-range-separator">a</span>
            <SearchableSelect className="time-range-select" name={toName} aria-label="Hasta" placeholder="hh:mm" value={toTime} onChange={onToTimeChange} options={timeOptionsFor(toTime)} />
        </div>
    )
}
