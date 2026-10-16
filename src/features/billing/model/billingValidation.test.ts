import { describe, expect, it } from 'vitest'
import { validateManualCharge, validatePaymentAdjustment, validatePaymentCollection, validatePaymentEdit } from './billingValidation'

describe('billing form validation', () => {
    it('reports every missing manual charge field', () => {
        expect(validateManualCharge({ studentId: '', category: 'Otro', detail: '', amount: '0', status: 'Pendiente', dueDate: '', date: '' })).toMatchObject({ valid: false, fieldErrors: { studentId: expect.any(String), detail: expect.any(String), amount: expect.any(String), dueDate: expect.any(String) } })
    })
    it('validates collection and edit dates', () => {
        expect(validatePaymentCollection({ date: '' }).valid).toBe(false)
        expect(validatePaymentEdit({ amount: -1, dueDate: '' }).fieldErrors).toHaveProperty('editAmount')
    })
    it('requires adjustment reasons and bounds percentages', () => {
        const base = { mode: 'percentage' as const, value: '', reason: '', dueDate: '2026-11-10' }
        expect(validatePaymentAdjustment({ ...base, type: 'Bonificacion total' }).valid).toBe(false)
        expect(validatePaymentAdjustment({ ...base, type: 'Promocion', value: '101', reason: 'Promo' }).valid).toBe(false)
        expect(validatePaymentAdjustment({ ...base, type: 'Promocion', value: '20', reason: 'Promo' }).valid).toBe(true)
    })
    it('lets the due date move alone, without a reason, but never empty', () => {
        expect(validatePaymentAdjustment({ type: 'Sin cambio', mode: 'percentage', value: '', reason: '', dueDate: '2026-11-20' }).valid).toBe(true)
        expect(validatePaymentAdjustment({ type: 'Sin cambio', mode: 'percentage', value: '', reason: '', dueDate: '' }).fieldErrors).toHaveProperty('adjustmentDueDate')
    })
})
