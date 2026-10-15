import { invalidForm, validForm, type FormValidationResult } from '@/components/forms/formValidation'
import type { AcademySettings } from '@/services/academySettingsRepository'

type PaymentSettings = Pick<AcademySettings['payments'], 'enabledMethods' | 'transferAlias' | 'transferCbu' | 'accountHolder' | 'accountTaxId' | 'paymentLink'>

// An enabled method is offered on the public enrollment form, so it needs the data the form shows for it.
// Same rule as the backend settings validation.
export function validatePaymentSettings({ enabledMethods, transferAlias, transferCbu, accountHolder, accountTaxId, paymentLink }: PaymentSettings): FormValidationResult {
    const errors: Record<string, string> = {}
    if (enabledMethods.includes('Transferencia')) {
        if (!transferAlias.trim()) errors.paymentsTransferAlias = 'Para habilitar Transferencia cargá el alias.'
        if (!transferCbu.trim()) errors.paymentsTransferCbu = 'Cargá el CBU / CVU.'
        if (!accountHolder.trim()) errors.paymentsAccountHolder = 'Cargá el titular de la cuenta.'
        if (!accountTaxId.trim()) errors.paymentsAccountTaxId = 'Cargá el CUIT / CUIL del titular.'
    }
    if (enabledMethods.includes('Mercado Pago') && !paymentLink.trim()) errors.paymentsPaymentLink = 'Para habilitar Mercado Pago cargá el link de pago.'
    return Object.keys(errors).length ? invalidForm('Completá los datos de los medios de pago habilitados.', errors) : validForm
}
