import { useSyncExternalStore } from 'react'
import type { PaymentMethod } from '@/types/domain'
import { addMonthsToDate } from '@/domain/shared/dateRules'
export { getExpenseDisplayStatus } from '@/domain/finance/expenseRules'
import { createRepositoryEvents } from '@/services/shared/repositoryEvents'
import { readStoredValue, writeStoredValue } from '@/services/shared/storage'

export type ExpenseStatus = 'Pendiente' | 'Pagado'
export type ExpenseCategory = 'Alquiler' | 'Servicios' | 'Sueldos' | 'Impuestos' | 'Insumos' | 'Otro'

export type Expense = {
    id: string
    branchId?: string
    seriesId?: string
    concept: string
    category: ExpenseCategory
    beneficiary: string
    branch: string
    amount: number
    dueDate?: string
    status: ExpenseStatus
    paidDate?: string
    method?: PaymentMethod
    notes?: string
    recurrence: 'Único' | 'Mensual'
}

export type ExpenseInput = Omit<Expense, 'id' | 'seriesId' | 'paidDate' | 'method'> & {
    repeatUntil?: string
    paidDate?: string
    method?: PaymentMethod
}

const storageKey = 'gestiq-finance-repository-v1'
const repositoryEvents = createRepositoryEvents(storageKey)

const initialExpenses: Expense[] = [
    { id: 'EXP-101', seriesId: 'SER-ALQUILER', concept: 'Alquiler de la sede', category: 'Alquiler', beneficiary: 'Inmobiliaria Centro', branch: 'Sede San José', amount: 420000, dueDate: '2026-09-10', status: 'Pendiente', recurrence: 'Mensual' },
    { id: 'EXP-102', concept: 'Servicio de internet', category: 'Servicios', beneficiary: 'Proveedor de internet', branch: 'Sede San José', amount: 46000, dueDate: '2026-09-08', status: 'Pendiente', recurrence: 'Mensual' },
    { id: 'EXP-103', concept: 'Material didáctico', category: 'Insumos', beneficiary: 'Librería Central', branch: 'Sede San José', amount: 85000, dueDate: '2026-09-03', status: 'Pagado', paidDate: '2026-09-02', method: 'Transferencia', recurrence: 'Único' },
    { id: 'EXP-104', seriesId: 'SER-ALQUILER', concept: 'Alquiler de la sede', category: 'Alquiler', beneficiary: 'Inmobiliaria Centro', branch: 'Sede San José', amount: 420000, dueDate: '2026-10-10', status: 'Pendiente', recurrence: 'Mensual' },
]

function read(): Expense[] {
    const saved = readStoredValue<Expense[] | null>(storageKey, null)
    return Array.isArray(saved) ? saved : initialExpenses
}

function write(expenses: Expense[]) {
    writeStoredValue(storageKey, expenses)
    repositoryEvents.emit()
}

export function useFinanceRepositoryVersion() {
    return useSyncExternalStore(repositoryEvents.subscribe, repositoryEvents.getRevision, () => 0)
}

export function listExpenses() {
    return read().map((expense) => ({ ...expense, branchId: expense.branchId ?? 'BR-1001' })).sort((a, b) => (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31'))
}

export function createExpense(input: ExpenseInput) {
    const baseId = Date.now()
    const seriesId = input.recurrence === 'Mensual' ? `SER-${baseId}` : undefined
    const limit = input.repeatUntil || (input.dueDate ? addMonthsToDate(input.dueDate, 11) : '')
    const dates: string[] = []
    for (let index = 0; index < (input.recurrence === 'Mensual' ? 60 : 1); index += 1) {
        const dueDate = input.dueDate ? addMonthsToDate(input.dueDate, index) : ''
        if (dueDate > limit) break
        dates.push(dueDate)
    }
    const created = dates.map((dueDate, index): Expense => ({
        id: `EXP-${baseId}-${index}`,
        branchId: input.branchId,
        seriesId,
        concept: input.concept,
        category: input.category,
        beneficiary: input.beneficiary,
        branch: input.branch,
        amount: input.amount,
        dueDate,
        status: index === 0 ? input.status : 'Pendiente',
        paidDate: index === 0 ? input.paidDate : undefined,
        method: index === 0 ? input.method : undefined,
        recurrence: input.recurrence,
        notes: input.notes,
    }))
    write([...read(), ...created])
    return created[0]
}

export function payExpense(id: string, paidDate: string, method: PaymentMethod) {
    write(read().map((expense) => expense.id === id ? { ...expense, status: 'Pagado', paidDate, method } : expense))
}

export function updateRecurringExpenses(id: string, changes: Partial<Expense>, scope: 'single' | 'future' | 'series') {
    const expenses = read()
    const target = expenses.find((expense) => expense.id === id)
    if (!target || scope === 'single' || !target.seriesId) {
        write(expenses.map((expense) => expense.id === id ? { ...expense, ...changes } : expense))
        return
    }

    write(expenses.map((expense) => {
        const belongsToSeries = expense.seriesId === target.seriesId
        const isInScope = scope === 'series' || !target.dueDate || !expense.dueDate || expense.dueDate >= target.dueDate
        return belongsToSeries && isInScope && expense.status !== 'Pagado' ? { ...expense, ...changes, dueDate: expense.dueDate } : expense
    }))
}

export function removeExpense(id: string) {
    write(read().filter((expense) => expense.id !== id))
}
