import type { PaymentMethod } from '@/types/domain'

// Every method a payment can be recorded with (matches the backend charges/expenses method values).
export const paymentMethods: PaymentMethod[] = ['Transferencia', 'Mercado Pago', 'Tarjeta', 'Efectivo']

// Methods to record a collected payment with: the ones enabled in Mi academia → Cobros, or all of them
// if none is enabled yet, so staff are never left unable to register a payment.
export function getRecordablePaymentMethods(enabledMethods: string[] | undefined): PaymentMethod[] {
    const enabled = paymentMethods.filter((method) => enabledMethods?.includes(method))
    return enabled.length > 0 ? enabled : paymentMethods
}
