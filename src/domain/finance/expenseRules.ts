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
        .filter((income) => income.status !== 'Rechazado' && income.status !== 'Anulado')
        .reduce((total, income) => total + Math.max(0, income.amount), 0)
    const plannedExpenses = expenses.reduce((total, expense) => total + Math.max(0, expense.amount), 0)
    const projectedBalance = projectedIncome - plannedExpenses
    const coverageRate = plannedExpenses > 0 ? (projectedIncome / plannedExpenses) * 100 : projectedIncome > 0 ? 100 : 0

    return { projectedIncome, plannedExpenses, projectedBalance, coverageRate }
}
