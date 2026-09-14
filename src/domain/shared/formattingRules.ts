const arsCurrency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export function formatCurrencyARS(value: number) {
    return arsCurrency.format(value)
}

export function formatShortDate(value?: string, fallback = 'Sin vencimiento') {
    return value ? value.split('-').reverse().join('/') : fallback
}
