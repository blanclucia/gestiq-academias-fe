import { invalidForm, validForm, type FormValidationResult } from '@/components/forms/formValidation'
import type { AcademySettings } from '@/services/academySettingsRepository'

type PaymentSettings = Pick<AcademySettings['payments'], 'enabledMethods' | 'transferAlias' | 'transferCbu' | 'accountHolder' | 'paymentLink'>

// An enabled method is offered on the public enrollment form, so it needs the data the form shows for it.
// Same rule as the backend settings validation.
export function validatePaymentSettings({ enabledMethods, transferAlias, transferCbu, accountHolder, paymentLink }: PaymentSettings): FormValidationResult {
    const errors: Record<string, string> = {}
    if (enabledMethods.includes('Transferencia')) {
        if (!transferAlias.trim() && !transferCbu.trim()) errors.paymentsTransferAlias = 'Para habilitar Transferencia cargá el alias o el CBU / CVU.'
        if (!accountHolder.trim()) errors.paymentsAccountHolder = 'Para habilitar Transferencia cargá el titular de la cuenta.'
    }
    if (enabledMethods.includes('Mercado Pago') && !paymentLink.trim()) errors.paymentsPaymentLink = 'Para habilitar Mercado Pago cargá el link de pago.'
    return Object.keys(errors).length ? invalidForm('Completá los datos de los medios de pago habilitados.', errors) : validForm
}
