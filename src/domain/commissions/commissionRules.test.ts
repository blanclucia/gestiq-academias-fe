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

    it('selects open commissions whose periods overlap', () => {
        const commissions = [
            { id: 'current', status: 'Activa', startDate: '2026-03-01', endDate: '2026-06-30' },
            { id: 'closed', status: 'Cerrada', startDate: '2026-03-01', endDate: '2026-06-30' },
            { id: 'future', status: 'Programada', startDate: '2026-08-01', endDate: '2026-10-31' },
        ]
        expect(getEligibleCommissions(commissions, '2026-06-15', '2026-07-15').map((item) => item.id)).toEqual(['current'])
        expect(getEligibleCommissions(commissions, '2026-01-01', '2026-12-31', ['future']).map((item) => item.id)).toEqual(['future'])
    })
})
