import { invalidForm, validForm, type FormValidationResult } from '@/components/forms/formValidation'
import type { AcademySettings } from '@/services/academySettingsRepository'
import { isValidCuit, normalizeCuit } from '@/domain/people/personRules'

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
    // Whatever is typed must be usable to transfer, enabled or not: a typo sends money to the wrong place.
    if (transferAlias.trim() && !/^[A-Za-z0-9.-]{6,20}$/.test(transferAlias.trim())) errors.paymentsTransferAlias = 'El alias tiene entre 6 y 20 caracteres: letras, números, punto o guion.'
    if (transferCbu.trim() && !/^\d{22}$/.test(transferCbu.replace(/\s/g, ''))) errors.paymentsTransferCbu = 'El CBU / CVU tiene 22 números.'
    if (accountTaxId.trim() && !isValidCuit(normalizeCuit(accountTaxId))) errors.paymentsAccountTaxId = 'Revisá el CUIT / CUIL: el número no es válido.'
    return Object.keys(errors).length ? invalidForm('Completá los datos de los medios de pago habilitados.', errors) : validForm
}
