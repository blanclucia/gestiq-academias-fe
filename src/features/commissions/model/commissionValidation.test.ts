import { describe, expect, it } from 'vitest'
import { validateCommission } from './commissionValidation'

describe('commission validation', () => {
    it('validates period, schedule and numeric limits', () => {
        const result = validateCommission({ name: '', teachers: [], capacity: 0, amount: -1, startDate: '2026-05-02', endDate: '2026-05-01', dueDay: 29, status: 'Programada', days: [], fromTime: '20:00', toTime: '19:00' })
        expect(result.fieldErrors).toMatchObject({ commissionName: expect.any(String), commissionCapacity: expect.any(String), commissionEndDate: expect.any(String), commissionDays: expect.any(String), commissionToTime: expect.any(String), commissionDueDay: expect.any(String) })
    })
})
