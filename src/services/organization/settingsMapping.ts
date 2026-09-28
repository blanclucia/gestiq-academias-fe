export function orgStatusToApi(status: 'Activa' | 'Inactiva'): 'active' | 'inactive' {
    return status === 'Activa' ? 'active' : 'inactive'
}
export function orgStatusFromApi(status: 'active' | 'inactive'): 'Activa' | 'Inactiva' {
    return status === 'active' ? 'Activa' : 'Inactiva'
}

export function confirmationModeToApi(mode: 'Automática' | 'Manual'): 'automatic' | 'manual' {
    return mode === 'Automática' ? 'automatic' : 'manual'
}
export function confirmationModeFromApi(mode: 'automatic' | 'manual'): 'Automática' | 'Manual' {
    return mode === 'automatic' ? 'Automática' : 'Manual'
}

const paymentMethodMap: Record<string, string> = { Transferencia: 'bank_transfer', Efectivo: 'cash', Tarjeta: 'card', 'Mercado Pago': 'mercado_pago' }
const paymentMethodReverseMap: Record<string, string> = Object.fromEntries(Object.entries(paymentMethodMap).map(([es, en]) => [en, es]))

export function paymentMethodsToApi(methods: string[]): string[] {
    return methods.map((method) => paymentMethodMap[method]).filter((method): method is string => Boolean(method))
}
export function paymentMethodsFromApi(methods: string[]): string[] {
    return methods.map((method) => paymentMethodReverseMap[method]).filter((method): method is string => Boolean(method))
}

const requiredFieldMap: Record<string, string> = { Documento: 'document', Email: 'email', Teléfono: 'phone', 'Fecha de nacimiento': 'birthDate', Dirección: 'address' }
const requiredFieldReverseMap: Record<string, string> = Object.fromEntries(Object.entries(requiredFieldMap).map(([es, en]) => [en, es]))

export function requiredFieldsToApi(fields: string[]): string[] {
    return fields.map((field) => requiredFieldMap[field]).filter((field): field is string => Boolean(field))
}
export function requiredFieldsFromApi(fields: string[]): string[] {
    return fields.map((field) => requiredFieldReverseMap[field]).filter((field): field is string => Boolean(field))
}
