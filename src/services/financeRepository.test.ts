// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createExpense, listExpenses } from './financeRepository'

describe('finance repository recurrence', () => {
    beforeEach(() => {
        window.localStorage.clear()
        vi.restoreAllMocks()
    })

    it('creates monthly expenses through the requested limit', () => {
        vi.spyOn(Date, 'now').mockReturnValue(2_000)
        createExpense({
            concept: 'Seguro',
            category: 'Servicios',
            beneficiary: 'Proveedor',
            branch: 'Sede San José',
            amount: 12_000,
            dueDate: '2026-01-31',
            repeatUntil: '2026-03-31',
            status: 'Pendiente',
            recurrence: 'Mensual',
        })

        const created = listExpenses().filter((expense) => expense.seriesId === 'SER-2000')
        expect(created.map((expense) => expense.dueDate)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31'])
    })
})
