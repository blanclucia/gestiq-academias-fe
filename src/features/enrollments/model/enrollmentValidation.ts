import { invalidForm, validForm, type FormValidationResult } from '@/components/forms/formValidation'
import type { EnrollmentFormValue } from '../components/EnrollmentForm'
import type { AcademicCommission } from '@/services/academy/academyTypes'
import { getEligibleCommissions } from '@/domain/commissions/commissionRules'

export function validateEnrollment(value: EnrollmentFormValue, commissions: AcademicCommission[]): FormValidationResult {
    const errors: Record<string, string> = {}
    if (!Number.isFinite(value.amount) || value.amount < 0) errors.enrollmentAmount = 'El costo no puede ser negativo.'
    if (!value.startDate) errors.enrollmentStartDate = 'Ingresá la fecha de inicio.'
    if (!value.endDate) errors.enrollmentEndDate = 'Ingresá la fecha de cierre.'
    else if (value.startDate && value.endDate < value.startDate) errors.enrollmentEndDate = 'La fecha de cierre debe ser posterior al inicio.'
    const eligible = getEligibleCommissions(commissions, value.startDate, value.endDate, value.commissionIds).length > 0
    if (!eligible) errors.enrollmentCommissions = 'Seleccioná al menos una comisión vigente para este período.'
    return Object.keys(errors).length ? invalidForm('Revisá los datos de la inscripción.', errors) : validForm
}
