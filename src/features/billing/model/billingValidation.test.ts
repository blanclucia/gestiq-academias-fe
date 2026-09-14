import { describe, expect, it } from 'vitest'
import { validateManualCharge, validatePaymentAdjustment, validatePaymentCollection, validatePaymentEdit } from './billingValidation'

describe('billing form validation', () => {
    it('reports every missing manual charge field', () => {
        expect(validateManualCharge({ category: 'Otro', detail: '', amount: '0', status: 'Pendiente', dueDate: '', date: '' })).toMatchObject({ valid: false, fieldErrors: { detail: expect.any(String), amount: expect.any(String), dueDate: expect.any(String) } })
    })
    it('validates collection and edit dates', () => {
        expect(validatePaymentCollection({ date: '' }).valid).toBe(false)
        expect(validatePaymentEdit({ amount: -1, dueDate: '' }).fieldErrors).toHaveProperty('editAmount')
    })
    it('requires adjustment reasons and bounds percentages', () => {
        expect(validatePaymentAdjustment({ type: 'Bonificacion total', mode: 'percentage', value: '', reason: '' }).valid).toBe(false)
        expect(validatePaymentAdjustment({ type: 'Promocion', mode: 'percentage', value: '101', reason: 'Promo' }).valid).toBe(false)
        expect(validatePaymentAdjustment({ type: 'Promocion', mode: 'percentage', value: '20', reason: 'Promo' }).valid).toBe(true)
    })
})
