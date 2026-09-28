// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { writeStoredValue } from '@/services/shared/storage'
import { listExpenses, type Expense } from './financeRepository'

const storageKey = 'gestiq-finance-repository-v1'

const rent: Expense = {
    id: '11111111-1111-4111-8111-000000000001', branchId: '22222222-2222-4222-8222-000000000001', seriesId: '11111111-1111-4111-8111-000000000001',
    concept: 'Alquiler', category: 'Alquiler', beneficiary: 'Inmobiliaria', amount: 420000, dueDate: '2026-03-10', status: 'Pendiente', recurrence: 'Mensual',
}
const utilities: Expense = {
    id: '33333333-3333-4333-8333-000000000001', branchId: '22222222-2222-4222-8222-000000000001',
    concept: 'Internet', category: 'Servicios', beneficiary: 'Proveedor', amount: 46000, dueDate: '2026-01-08', status: 'Pendiente', recurrence: 'Único',
}

describe('finance repository', () => {
    beforeEach(() => window.localStorage.clear())

    it('reads an empty mirror before useExpenses() ever populates it', () => {
        expect(listExpenses()).toEqual([])
    })

    it('reads the local mirror kept warm by useExpenses(), sorted by due date', () => {
        writeStoredValue(storageKey, [rent, utilities])
        expect(listExpenses().map((expense) => expense.id)).toEqual([utilities.id, rent.id])
    })
})
