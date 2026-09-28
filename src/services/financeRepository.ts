import { useEffect, useSyncExternalStore } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/AuthContext'
import type { PaymentMethod } from '@/types/domain'
export { getExpenseDisplayStatus } from '@/domain/finance/expenseRules'
import { createRepositoryEvents } from '@/services/shared/repositoryEvents'
import { readStoredValue, writeStoredValue } from '@/services/shared/storage'
import { chargeMethodFromApi, chargeMethodToApi } from '@/services/organization/chargesMapping'
import { createExpenseApi, deleteExpenseApi, fetchExpenses, updateExpenseApi, type ApiExpense, type ApiExpenseCreate, type ApiExpensePatch } from '@/services/organization/expensesApi'
import { expenseCategoryFromApi, expenseCategoryToApi, expenseRecurrenceFromApi, expenseRecurrenceToApi, expenseStatusFromApi, expenseStatusToApi } from '@/services/organization/expensesMapping'

export type ExpenseStatus = 'Pendiente' | 'Pagado'
export type ExpenseCategory = 'Alquiler' | 'Servicios' | 'Sueldos' | 'Impuestos' | 'Insumos' | 'Otro'

export type Expense = {
    id: string
    branchId: string
    seriesId?: string
    concept: string
    category: ExpenseCategory
    beneficiary: string
    amount: number
    dueDate?: string
    status: ExpenseStatus
    paidDate?: string
    method?: PaymentMethod
    notes?: string
    recurrence: 'Único' | 'Mensual'
}

export type ExpenseInput = Omit<Expense, 'id' | 'seriesId'> & { repeatUntil?: string }

// financeRepository has always kept its own storage independent of AcademyState — this stays as
// the local mirror of the real backend (kept warm by useExpenses()/<ExpensesSync>) instead of the
// old local-only expenses; same repositoryEvents mechanism, just repurposed as a cache.
const storageKey = 'gestiq-finance-repository-v1'
const repositoryEvents = createRepositoryEvents(storageKey)

function readMirror(): Expense[] {
    const saved = readStoredValue<Expense[] | null>(storageKey, null)
    return Array.isArray(saved) ? saved : []
}
function writeMirror(expenses: Expense[]) {
    writeStoredValue(storageKey, expenses)
    repositoryEvents.emit()
}
function sameMirror(current: Expense[], next: Expense[]): boolean {
    return JSON.stringify(current) === JSON.stringify(next)
}

export function useFinanceRepositoryVersion() {
    return useSyncExternalStore(repositoryEvents.subscribe, repositoryEvents.getRevision, () => 0)
}

export function listExpenses(): Expense[] {
    return readMirror().slice().sort((a, b) => (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31'))
}

function fromApiExpense(e: ApiExpense): Expense {
    return {
        id: e.id, branchId: e.branchId, seriesId: e.seriesId, concept: e.concept, category: expenseCategoryFromApi(e.category),
        beneficiary: e.beneficiary, amount: e.amount, dueDate: e.dueDate, status: expenseStatusFromApi(e.status),
        paidDate: e.paidDate, method: e.method ? chargeMethodFromApi(e.method) : undefined,
        notes: e.notes || undefined, recurrence: expenseRecurrenceFromApi(e.recurrence),
    }
}

export function useExpenses(options: { enabled?: boolean } = {}) {
    const { session } = useAuth()
    const organizationSlug = session?.organization.slug
    const query = useQuery({
        queryKey: ['expenses', organizationSlug],
        queryFn: ({ signal }) => fetchExpenses(organizationSlug!, {}, signal),
        enabled: Boolean(organizationSlug) && (options.enabled ?? true),
    })
    useEffect(() => {
        if (!query.data) return
        const mapped = query.data.map(fromApiExpense)
        if (!sameMirror(readMirror(), mapped)) {
            writeMirror(mapped)
        }
    }, [query.data])
    return { isLoading: query.isLoading, isError: query.isError }
}

export function useCreateExpense() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async (input: ExpenseInput) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            const payload: ApiExpenseCreate = {
                branchId: input.branchId, concept: input.concept, category: expenseCategoryToApi(input.category),
                beneficiary: input.beneficiary, amount: input.amount, dueDate: input.dueDate || undefined,
                status: expenseStatusToApi(input.status), paidDate: input.paidDate,
                method: input.method ? chargeMethodToApi(input.method) : undefined,
                notes: input.notes ?? '', recurrence: expenseRecurrenceToApi(input.recurrence), repeatUntil: input.repeatUntil || undefined,
            }
            return createExpenseApi(organizationSlug, payload)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses', organizationSlug] }),
    })
}

export function useUpdateExpense() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async ({ id, changes, scope }: { id: string; changes: Partial<ExpenseInput>; scope?: 'single' | 'future' | 'series' }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            const patch: ApiExpensePatch = {}
            if (changes.concept !== undefined) patch.concept = changes.concept
            if (changes.category !== undefined) patch.category = expenseCategoryToApi(changes.category)
            if (changes.beneficiary !== undefined) patch.beneficiary = changes.beneficiary
            if (changes.amount !== undefined) patch.amount = changes.amount
            if (changes.dueDate !== undefined) patch.dueDate = changes.dueDate
            if (changes.status !== undefined) patch.status = expenseStatusToApi(changes.status)
            if (changes.paidDate !== undefined) patch.paidDate = changes.paidDate
            if (changes.method !== undefined) patch.method = chargeMethodToApi(changes.method)
            if (changes.notes !== undefined) patch.notes = changes.notes
            if (scope) patch.scope = scope
            return updateExpenseApi(organizationSlug, id, patch)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses', organizationSlug] }),
    })
}

export function useDeleteExpense() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async (id: string) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            await deleteExpenseApi(organizationSlug, id)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses', organizationSlug] }),
    })
}
