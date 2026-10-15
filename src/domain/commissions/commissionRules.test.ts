import { describe, expect, it } from 'vitest'
import { calculateOccupancy, getEligibleCommissions } from './commissionRules'

describe('commission rules', () => {
    it('calculates rounded occupancy', () => {
        expect(calculateOccupancy(7, 12)).toBe(58)
    })

    it('handles invalid capacity without returning Infinity', () => {
        expect(calculateOccupancy(4, 0)).toBe(0)
        expect(calculateOccupancy(4, Number.NaN)).toBe(0)
    })

    it('does not allow a negative student count', () => {
        expect(calculateOccupancy(-2, 10)).toBe(0)
    })

    it('accepts commissions in progress or starting later, and rejects finished or closed ones', () => {
        const commissions = [
            { id: 'current', status: 'Activa', startDate: '2026-03-01', endDate: '2026-12-15' },
            { id: 'october', status: 'Programada', startDate: '2026-10-01', endDate: '2026-12-15' },
            { id: 'november', status: 'Programada', startDate: '2026-11-01', endDate: '2027-02-28' },
            { id: 'finished', status: 'Activa', startDate: '2026-03-01', endDate: '2026-08-31' },
            { id: 'closed', status: 'Cerrada', startDate: '2026-03-01', endDate: '2026-12-15' },
        ]
        // Enrollment open in September: October and November commissions start after it closes and still count.
        expect(getEligibleCommissions(commissions, '2026-09-01').map((item) => item.id)).toEqual(['current', 'october', 'november'])
    })

    it('keeps only the selected commissions when ids are given', () => {
        const commissions = [
            { id: 'october', status: 'Programada', startDate: '2026-10-01', endDate: '2026-12-15' },
            { id: 'november', status: 'Programada', startDate: '2026-11-01', endDate: '2027-02-28' },
        ]
        expect(getEligibleCommissions(commissions, '2026-09-01', ['november']).map((item) => item.id)).toEqual(['november'])
    })
})
