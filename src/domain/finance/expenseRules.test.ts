import { describe, expect, it } from 'vitest'
import { calculateFinancialProjection, getExpenseDisplayStatus } from './expenseRules'

describe('expense rules', () => {
    it('prioritizes paid status and detects overdue expenses', () => {
        expect(getExpenseDisplayStatus({ status: 'Pagado', dueDate: '2020-01-01' }, '2026-09-09')).toBe('Pagado')
        expect(getExpenseDisplayStatus({ status: 'Pendiente', dueDate: '2026-09-08' }, '2026-09-09')).toBe('Vencido')
        expect(getExpenseDisplayStatus({ status: 'Pendiente', dueDate: '2026-09-09' }, '2026-09-09')).toBe('Pendiente')
    })
})

describe('calculateFinancialProjection', () => {
    it('compara ingresos cobrables (rechazados incluidos, anulados no) contra todos los egresos planificados', () => {
        expect(calculateFinancialProjection([
            { amount: 40_000, status: 'Pagado' },
            { amount: 60_000, status: 'Pendiente' },
            { amount: 20_000, status: 'Rechazado' },
            { amount: 30_000, status: 'Anulado' },
        ], [
            { amount: 70_000 },
            { amount: 10_000 },
        ])).toEqual({ projectedIncome: 120_000, plannedExpenses: 80_000, projectedBalance: 40_000, coverageRate: 150 })
    })

    it('evita dividir por cero cuando no hay egresos', () => {
        expect(calculateFinancialProjection([{ amount: 10_000, status: 'Pendiente' }], [])).toEqual({ projectedIncome: 10_000, plannedExpenses: 0, projectedBalance: 10_000, coverageRate: null })
    })
})
