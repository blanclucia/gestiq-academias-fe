import { describe, expect, it } from 'vitest'
import { formatAgendaTime, getAgendaDatesInYear, getAgendaRangeSegments, getCalendarDays, getWeeklyAgendaDates, shiftAgendaDate } from './agendaRules'

describe('agenda rules', () => {
    it('creates a stable six-week calendar grid', () => {
        const days = getCalendarDays(2026, 8)
        expect(days).toHaveLength(42)
        expect(days[0]).toMatchObject({ date: '2026-08-30', outside: true })
        expect(days[41]).toMatchObject({ date: '2026-10-10', outside: true })
    })

    it('formats times and segments multi-day events', () => {
        expect(formatAgendaTime('18:05')).toBe('6:05pm')
        const week = ['2026-08-30', '2026-08-31', '2026-09-01'].map((date, index) => ({ date, outside: index < 2 }))
        expect(getAgendaRangeSegments({ id: '1', title: 'Evento', type: 'otro', scope: 'general', date: '2026-08-31', endDate: '2026-09-01', allDay: true, source: 'admin', createdAt: '2026-08-01' }, week)).toEqual([
            { startColumn: 1, endColumn: 1, outside: true },
            { startColumn: 2, endColumn: 2, outside: false },
        ])
    })

    it('builds recurring dates within the requested year', () => {
        expect(shiftAgendaDate('2026-12-31', 1)).toBe('2027-01-01')
        expect(getAgendaDatesInYear('2025-12-30', '2026-01-02', 2026)).toEqual(['2026-01-01', '2026-01-02'])
        expect(getWeeklyAgendaDates('2026-09-07', '2026-09-13', [1, 3], 2026)).toEqual(['2026-09-07', '2026-09-09'])
    })
})
