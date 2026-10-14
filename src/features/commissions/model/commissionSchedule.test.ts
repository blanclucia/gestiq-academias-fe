import { describe, expect, it } from 'vitest'
import { formatCommissionSchedule, parseCommissionSchedule } from './commissionSchedule'

describe('commission schedule', () => {
    it('reads back every configured day and time', () => {
        expect(parseCommissionSchedule('Mar / Jue / Sáb · 09:30 - 11:00')).toEqual({ days: ['Martes', 'Jueves', 'Sábado'], fromTime: '09:30', toTime: '11:00' })
    })

    it('round-trips what the form writes', () => {
        const schedule = { days: ['Lunes', 'Miércoles', 'Viernes'], fromTime: '18:30', toTime: '20:00' }
        expect(parseCommissionSchedule(formatCommissionSchedule(schedule))).toEqual(schedule)
    })

    it('accepts days without accents', () => {
        expect(parseCommissionSchedule('Mie / Sab · 10:00 - 12:00').days).toEqual(['Miércoles', 'Sábado'])
    })

    it('keeps the times when no day is set and falls back to defaults when unparseable', () => {
        expect(parseCommissionSchedule('Horario a definir · 08:00 - 09:00')).toEqual({ days: [], fromTime: '08:00', toTime: '09:00' })
        expect(parseCommissionSchedule('')).toEqual({ days: [], fromTime: '18:30', toTime: '20:00' })
    })

    it('formats days in week order', () => {
        expect(formatCommissionSchedule({ days: ['Viernes', 'Lunes'], fromTime: '18:00', toTime: '19:00' })).toBe('Lun / Vie · 18:00 - 19:00')
    })
})
