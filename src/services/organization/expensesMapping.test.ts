import { describe, expect, it } from 'vitest'
import { expenseCategoryFromApi, expenseCategoryToApi, expenseRecurrenceFromApi, expenseRecurrenceToApi, expenseStatusFromApi, expenseStatusToApi } from './expensesMapping'

describe('expense category, status and recurrence mapping', () => {
    it('maps every category both ways', () => {
        const pairs: Array<['Alquiler' | 'Servicios' | 'Sueldos' | 'Impuestos' | 'Insumos' | 'Otro', 'rent' | 'utilities' | 'salaries' | 'taxes' | 'supplies' | 'other']> = [
            ['Alquiler', 'rent'], ['Servicios', 'utilities'], ['Sueldos', 'salaries'], ['Impuestos', 'taxes'], ['Insumos', 'supplies'], ['Otro', 'other'],
        ]
        for (const [es, en] of pairs) {
            expect(expenseCategoryToApi(es)).toBe(en)
            expect(expenseCategoryFromApi(en)).toBe(es)
        }
    })
    it('maps status both ways', () => {
        expect(expenseStatusToApi('Pendiente')).toBe('pending')
        expect(expenseStatusToApi('Pagado')).toBe('paid')
        expect(expenseStatusFromApi('pending')).toBe('Pendiente')
        expect(expenseStatusFromApi('paid')).toBe('Pagado')
    })
    it('maps recurrence both ways', () => {
        expect(expenseRecurrenceToApi('Único')).toBe('single')
        expect(expenseRecurrenceToApi('Mensual')).toBe('monthly')
        expect(expenseRecurrenceFromApi('single')).toBe('Único')
        expect(expenseRecurrenceFromApi('monthly')).toBe('Mensual')
    })
})
