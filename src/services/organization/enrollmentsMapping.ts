export function openingStatusToApi(status: 'Abierta' | 'Programada' | 'Cerrada'): 'open' | 'scheduled' | 'closed' {
    if (status === 'Abierta') return 'open'
    if (status === 'Cerrada') return 'closed'
    return 'scheduled'
}
export function openingStatusFromApi(status: 'open' | 'scheduled' | 'closed'): 'Abierta' | 'Programada' | 'Cerrada' {
    if (status === 'open') return 'Abierta'
    if (status === 'closed') return 'Cerrada'
    return 'Programada'
}
