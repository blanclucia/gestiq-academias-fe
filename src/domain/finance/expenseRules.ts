import type { BillingDisplayStatus } from '@/types/domain'

export type ExpenseDisplayInput = { status: 'Pendiente' | 'Pagado'; dueDate?: string }

export function getExpenseDisplayStatus(expense: ExpenseDisplayInput, today: string): 'Pendiente' | 'Pagado' | 'Vencido' {
    if (expense.status === 'Pagado') return 'Pagado'
    return expense.dueDate && expense.dueDate < today ? 'Vencido' : 'Pendiente'
}

type ProjectedIncome = { amount: number; status: BillingDisplayStatus }
type PlannedExpense = { amount: number }

export function calculateFinancialProjection(incomes: ProjectedIncome[], expenses: PlannedExpense[]) {
    const projectedIncome = incomes
        // A rejected transfer is still owed (Cobros keeps it as collectable); only a voided charge is not income.
        .filter((income) => income.status !== 'Anulado')
        .reduce((total, income) => total + Math.max(0, income.amount), 0)
    const plannedExpenses = expenses.reduce((total, expense) => total + Math.max(0, expense.amount), 0)
    const projectedBalance = projectedIncome - plannedExpenses
    // Without planned expenses there is nothing to cover: null, instead of a misleading 100%.
    const coverageRate = plannedExpenses > 0 ? (projectedIncome / plannedExpenses) * 100 : null

    return { projectedIncome, plannedExpenses, projectedBalance, coverageRate }
}
