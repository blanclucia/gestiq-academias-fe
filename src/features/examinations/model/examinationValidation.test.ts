import { describe, expect, it } from 'vitest'
import { validateExamination } from './examinationValidation'

describe('examination validation', () => {
    it('requires valid fields and an audience for new exams', () => {
        expect(validateExamination({ title: '', examDate: '', firstPaymentDueDate: '', feeAmount: '0', installmentCount: '13' }, 0).fieldErrors).toHaveProperty('examStudents')
    })
    it('does not require selecting students while editing', () => {
        expect(validateExamination({ title: 'Final', examDate: '2026-12-01', firstPaymentDueDate: '2026-10-01', feeAmount: '1000', installmentCount: '2' }, 0, true).valid).toBe(true)
    })
})
