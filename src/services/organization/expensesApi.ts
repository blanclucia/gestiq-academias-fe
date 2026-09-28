import { z } from 'zod'
import { authClient } from '@/auth/api/authClient'

const apiExpenseSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    seriesId: z.string().optional(),
    branchId: z.string(),
    concept: z.string(),
    category: z.enum(['rent', 'utilities', 'salaries', 'taxes', 'supplies', 'other']),
    beneficiary: z.string(),
    amount: z.number(),
    dueDate: z.string().optional(),
    status: z.enum(['pending', 'paid']),
    paidDate: z.string().optional(),
    method: z.enum(['transfer', 'card', 'cash']).optional(),
    notes: z.string(),
    recurrence: z.enum(['single', 'monthly']),
})
const apiExpenseListSchema = z.object({ items: z.array(apiExpenseSchema) })

export type ApiExpense = z.infer<typeof apiExpenseSchema>
export type ApiExpenseCreate = {
    branchId: string
    concept: string
    category: 'rent' | 'utilities' | 'salaries' | 'taxes' | 'supplies' | 'other'
    beneficiary: string
    amount: number
    dueDate?: string
    status?: 'pending' | 'paid'
    paidDate?: string
    method?: 'transfer' | 'card' | 'cash'
    notes: string
    recurrence: 'single' | 'monthly'
    repeatUntil?: string
}
export type ApiExpensePatch = Partial<Omit<ApiExpenseCreate, 'branchId' | 'recurrence' | 'repeatUntil'>> & { scope?: 'single' | 'future' | 'series' }
export type ApiExpenseFilter = { branchId?: string; status?: string; category?: string }
type Requester = (path: string, init?: RequestInit) => Promise<unknown>
const defaultRequest: Requester = (path, init) => authClient.authorizedRequest(path, init)

function expensesPath(organizationSlug: string, suffix = '') {
    return `/organizations/${organizationSlug}/expenses${suffix}`
}

export async function fetchExpenses(organizationSlug: string, filter: ApiExpenseFilter = {}, signal?: AbortSignal, request: Requester = defaultRequest): Promise<ApiExpense[]> {
    const params = new URLSearchParams()
    if (filter.branchId) params.set('branchId', filter.branchId)
    if (filter.status) params.set('status', filter.status)
    if (filter.category) params.set('category', filter.category)
    const query = params.toString()
    const result = apiExpenseListSchema.parse(await request(expensesPath(organizationSlug, query ? `?${query}` : ''), { signal }))
    return result.items
}

export async function createExpenseApi(organizationSlug: string, input: ApiExpenseCreate, request: Requester = defaultRequest): Promise<ApiExpense> {
    return apiExpenseSchema.parse(await request(expensesPath(organizationSlug), { method: 'POST', body: JSON.stringify(input) }))
}

export async function updateExpenseApi(organizationSlug: string, expenseId: string, patch: ApiExpensePatch, request: Requester = defaultRequest): Promise<ApiExpense> {
    return apiExpenseSchema.parse(await request(expensesPath(organizationSlug, `/${expenseId}`), { method: 'PATCH', body: JSON.stringify(patch) }))
}

export async function deleteExpenseApi(organizationSlug: string, expenseId: string, request: Requester = defaultRequest): Promise<void> {
    await request(expensesPath(organizationSlug, `/${expenseId}`), { method: 'DELETE' })
}
