import { invalidForm, validForm, type FormValidationResult } from '@/components/forms/formValidation'

type ManualChargeValue = { category: string; detail: string; amount: string; status: 'Pendiente' | 'Pagado'; dueDate: string; date: string }
type AdjustmentValue = { type: 'Bonificacion total' | 'Promocion' | 'Importe manual'; mode: 'percentage' | 'fixed'; value: string; reason: string }

export function validateManualCharge(value: ManualChargeValue): FormValidationResult {
    const fieldErrors: Record<string, string> = {}
    if (!value.category) fieldErrors.category = 'Seleccioná una categoría.'
    if (value.category === 'Otro' && !value.detail.trim()) fieldErrors.detail = 'Ingresá el concepto del cobro.'
    if (!Number.isFinite(Number(value.amount)) || Number(value.amount) <= 0) fieldErrors.amount = 'Ingresá un importe mayor a cero.'
    if (value.status === 'Pendiente' && !value.dueDate) fieldErrors.dueDate = 'Ingresá el vencimiento.'
    if (value.status === 'Pagado' && !value.date) fieldErrors.date = 'Ingresá la fecha de pago.'
    return Object.keys(fieldErrors).length ? invalidForm('Revisá los datos obligatorios del cobro.', fieldErrors) : validForm
}

export function validatePaymentCollection(value: { date: string }): FormValidationResult {
    return value.date ? validForm : invalidForm('Ingresá la fecha del cobro.', { collectionDate: 'La fecha es obligatoria.' })
}

export function validatePaymentEdit(value: { amount: number; dueDate: string }): FormValidationResult {
    const fieldErrors: Record<string, string> = {}
    if (!Number.isFinite(value.amount) || value.amount < 0) fieldErrors.editAmount = 'El importe no puede ser negativo.'
    if (!value.dueDate) fieldErrors.editDueDate = 'El vencimiento es obligatorio.'
    return Object.keys(fieldErrors).length ? invalidForm('Revisá los datos del pago.', fieldErrors) : validForm
}

export function validatePaymentAdjustment(value: AdjustmentValue): FormValidationResult {
    if (!value.reason.trim()) return invalidForm('Indicá el motivo del ajuste.', { adjustmentReason: 'El motivo es obligatorio.' })
    if (value.type === 'Bonificacion total') return validForm
    const amount = Number(value.value)
    if (!Number.isFinite(amount) || amount < 0) return invalidForm('Ingresá un valor válido para el ajuste.', { adjustmentValue: 'Ingresá un valor mayor o igual a cero.' })
    if (value.type === 'Promocion' && value.mode === 'percentage' && amount > 100) return invalidForm('El porcentaje no puede superar 100%.', { adjustmentValue: 'Usá un porcentaje entre 0 y 100.' })
    return validForm
}
