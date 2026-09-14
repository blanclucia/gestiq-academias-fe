import { invalidForm, validForm, type FormValidationResult } from '@/components/forms/formValidation'

type ExamValue = { title: string; examDate: string; firstPaymentDueDate: string; feeAmount: string; installmentCount: string }

export function validateExamination(value: ExamValue, studentCount: number, editing = false): FormValidationResult {
    const errors: Record<string, string> = {}
    if (!value.title.trim()) errors.examTitle = 'Ingresá un nombre.'
    if (!value.examDate) errors.examDate = 'Ingresá la fecha del examen.'
    if (!value.firstPaymentDueDate) errors.examDueDate = 'Ingresá el primer vencimiento.'
    if (!Number.isFinite(Number(value.feeAmount)) || Number(value.feeAmount) <= 0) errors.examFeeAmount = 'El arancel debe ser mayor a cero.'
    const installments = Number(value.installmentCount)
    if (!Number.isInteger(installments) || installments < 1 || installments > 12) errors.examInstallments = 'Usá entre 1 y 12 cuotas.'
    if (!editing && studentCount === 0) errors.examStudents = 'Seleccioná al menos un alumno activo.'
    return Object.keys(errors).length ? invalidForm('Revisá los datos obligatorios del examen.', errors) : validForm
}
