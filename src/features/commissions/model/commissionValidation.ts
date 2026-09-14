import { invalidForm, validForm, type FormValidationResult } from '@/components/forms/formValidation'
import type { CommissionFormValue } from '../components/CommissionForm'

export function validateCommission(value: CommissionFormValue, existingNames: string[] = []): FormValidationResult {
    const errors: Record<string, string> = {}
    if (!value.name.trim()) errors.commissionName = 'Ingresá un nombre.'
    else if (existingNames.some((name) => name.trim().toLocaleLowerCase('es-AR') === value.name.trim().toLocaleLowerCase('es-AR'))) errors.commissionName = 'Ya existe una comisión con ese nombre.'
    if (!Number.isFinite(value.capacity) || value.capacity < 1) errors.commissionCapacity = 'El cupo debe ser mayor a cero.'
    if (!Number.isFinite(value.amount) || value.amount < 0) errors.commissionAmount = 'El importe no puede ser negativo.'
    if (!value.startDate) errors.commissionStartDate = 'Ingresá la fecha de inicio.'
    if (!value.endDate) errors.commissionEndDate = 'Ingresá la fecha de fin.'
    else if (value.startDate && value.endDate < value.startDate) errors.commissionEndDate = 'La fecha de fin debe ser posterior al inicio.'
    if (value.days.length === 0) errors.commissionDays = 'Seleccioná al menos un día.'
    if (!value.fromTime) errors.commissionFromTime = 'Ingresá el horario de inicio.'
    if (!value.toTime) errors.commissionToTime = 'Ingresá el horario de fin.'
    else if (value.fromTime && value.toTime <= value.fromTime) errors.commissionToTime = 'El horario de fin debe ser posterior al inicio.'
    if (value.dueDay < 1 || value.dueDay > 28) errors.commissionDueDay = 'Usá un día entre 1 y 28.'
    return Object.keys(errors).length ? invalidForm('Revisá los datos obligatorios de la comisión.', errors) : validForm
}
