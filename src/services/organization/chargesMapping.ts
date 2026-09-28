import type { ApiCharge } from './chargesApi'

export function chargeStatusToApi(status: 'Pendiente' | 'Pagado' | 'En verificación' | 'Rechazado'): 'pending' | 'paid' | 'under_review' | 'rejected' {
    if (status === 'Pagado') return 'paid'
    if (status === 'En verificación') return 'under_review'
    if (status === 'Rechazado') return 'rejected'
    return 'pending'
}
export function chargeStatusFromApi(status: 'pending' | 'paid' | 'under_review' | 'rejected'): 'Pendiente' | 'Pagado' | 'En verificación' | 'Rechazado' {
    if (status === 'paid') return 'Pagado'
    if (status === 'under_review') return 'En verificación'
    if (status === 'rejected') return 'Rechazado'
    return 'Pendiente'
}
export function chargeMethodToApi(method: 'Transferencia' | 'Tarjeta' | 'Efectivo'): 'transfer' | 'card' | 'cash' {
    if (method === 'Tarjeta') return 'card'
    if (method === 'Efectivo') return 'cash'
    return 'transfer'
}
export function chargeMethodFromApi(method: 'transfer' | 'card' | 'cash'): 'Transferencia' | 'Tarjeta' | 'Efectivo' {
    if (method === 'card') return 'Tarjeta'
    if (method === 'cash') return 'Efectivo'
    return 'Transferencia'
}

// "Vencido" is already derived generically by resolveChargeCollectionStatus() from status+dueDate
// for any row, mock or real. "Parcial" isn't — the shared pipeline has no notion of a real partial
// paidAmount, so a genuinely partially-paid real charge (status still 'pending') needs to be
// pre-labeled here using its actual paidAmount, instead of the amount/2 approximation mock rows use.
export function chargeStatusFromApiWithPartial(charge: Pick<ApiCharge, 'status' | 'amount' | 'paidAmount'>): 'Pendiente' | 'Pagado' | 'En verificación' | 'Rechazado' | 'Parcial' {
    if (charge.status === 'pending' && charge.paidAmount && charge.paidAmount > 0 && charge.paidAmount < charge.amount) return 'Parcial'
    return chargeStatusFromApi(charge.status)
}
