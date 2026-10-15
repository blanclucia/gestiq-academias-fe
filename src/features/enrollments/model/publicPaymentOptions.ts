export type PublicPaymentOptions = { mercadoPago: boolean; transfer: boolean; inPerson: boolean }

type PaymentSetup = {
    enabledMethods: string[]
    paymentLink: string
    transferAlias: string
    transferCbu: string
}

// Payment methods the public enrollment form offers: enabled AND usable (Mercado Pago needs its link,
// a transfer needs an alias or CBU). If nothing else is left, paying in person is always offered so
// the payment step is never empty.
export function getPublicPaymentOptions({ enabledMethods, paymentLink, transferAlias, transferCbu }: PaymentSetup): PublicPaymentOptions {
    const mercadoPago = enabledMethods.includes('Mercado Pago') && Boolean(paymentLink.trim())
    const transfer = enabledMethods.includes('Transferencia') && Boolean(transferAlias.trim() || transferCbu.trim())
    const inPerson = enabledMethods.includes('Efectivo') || (!mercadoPago && !transfer)
    return { mercadoPago, transfer, inPerson }
}

// The payment step is shown whenever the enrollment has a cost; a free enrollment skips it.
export function requiresPaymentStep(amount: number) {
    return amount > 0
}
