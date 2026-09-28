import { describe, expect, it, vi } from 'vitest'
import { createExpenseApi, deleteExpenseApi, fetchExpenses, updateExpenseApi } from './expensesApi'

const apiExpense = {
    id: 'e1', organizationId: 'org1', branchId: 'b1', concept: 'Alquiler', category: 'rent' as const,
    beneficiary: 'Inmobiliaria', amount: 420000, dueDate: '2026-03-10', status: 'pending' as const, notes: '', recurrence: 'single' as const,
}

describe('expenses API client', () => {
    it('lists expenses for an organization with no filters', async () => {
        const request = vi.fn().mockResolvedValue({ items: [apiExpense] })
        const expenses = await fetchExpenses('academy-demo', {}, undefined, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/expenses', expect.objectContaining({ signal: undefined }))
        expect(expenses).toEqual([apiExpense])
    })
    it('lists expenses with query filters', async () => {
        const request = vi.fn().mockResolvedValue({ items: [] })
        await fetchExpenses('academy-demo', { branchId: 'b1', status: 'pending', category: 'rent' }, undefined, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/expenses?branchId=b1&status=pending&category=rent', expect.objectContaining({ signal: undefined }))
    })
    it('creates an expense with the given payload', async () => {
        const request = vi.fn().mockResolvedValue(apiExpense)
        const input = { branchId: 'b1', concept: 'Alquiler', category: 'rent' as const, beneficiary: 'Inmobiliaria', amount: 420000, dueDate: '2026-03-10', notes: '', recurrence: 'single' as const }
        const created = await createExpenseApi('academy-demo', input, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/expenses', { method: 'POST', body: JSON.stringify(input) })
        expect(created).toEqual(apiExpense)
    })
    it('patches only the given expense fields, including scope', async () => {
        const request = vi.fn().mockResolvedValue(apiExpense)
        await updateExpenseApi('academy-demo', 'e1', { amount: 450000, scope: 'future' }, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/expenses/e1', { method: 'PATCH', body: JSON.stringify({ amount: 450000, scope: 'future' }) })
    })
    it('deletes an expense with no body', async () => {
        const request = vi.fn().mockResolvedValue(undefined)
        await deleteExpenseApi('academy-demo', 'e1', request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/expenses/e1', { method: 'DELETE' })
    })
    it('rejects a malformed response instead of returning bad data', async () => {
        const request = vi.fn().mockResolvedValue({ items: [{ ...apiExpense, category: 'invalid' }] })
        await expect(fetchExpenses('academy-demo', {}, undefined, request)).rejects.toThrow()
    })
})
