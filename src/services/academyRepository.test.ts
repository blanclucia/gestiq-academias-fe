// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCommissionExam, listCommissionExams, listPayments } from './academyRepository'

describe('academy repository examination billing', () => {
    beforeEach(() => {
        window.localStorage.clear()
        vi.restoreAllMocks()
    })

    it('creates exact installments for every enrolled student', () => {
        vi.spyOn(Date, 'now').mockReturnValue(1_000)
        const exam = createCommissionExam({
            commissionId: 'COM-101',
            title: 'First Certificate',
            examDate: '2026-11-20',
            firstPaymentDueDate: '2026-09-30',
            feeAmount: 10_000,
            installmentCount: 3,
        }, ['ST-1001'])

        const charges = listPayments().filter((payment) => payment.id.startsWith('PAY-EXAM-1000-'))
        expect(listCommissionExams('COM-101')[0]).toMatchObject({ id: exam.id, status: 'Abierto' })
        expect(charges.map((charge) => charge.amount)).toEqual([3333, 3333, 3334])
        expect(charges.map((charge) => charge.dueDate)).toEqual(['2026-09-30', '2026-10-30', '2026-11-30'])
    })
})
