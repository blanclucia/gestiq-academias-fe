export function cycleStatusToApi(status: 'Borrador' | 'Activo' | 'Cerrado'): 'draft' | 'active' | 'closed' {
    if (status === 'Borrador') return 'draft'
    if (status === 'Activo') return 'active'
    return 'closed'
}
export function cycleStatusFromApi(status: 'draft' | 'active' | 'closed'): 'Borrador' | 'Activo' | 'Cerrado' {
    if (status === 'draft') return 'Borrador'
    if (status === 'active') return 'Activo'
    return 'Cerrado'
}

export function courseStatusToApi(status: 'Activo' | 'Borrador' | 'Cerrado'): 'active' | 'draft' | 'closed' {
    if (status === 'Activo') return 'active'
    if (status === 'Borrador') return 'draft'
    return 'closed'
}
export function courseStatusFromApi(status: 'active' | 'draft' | 'closed'): 'Activo' | 'Borrador' | 'Cerrado' {
    if (status === 'active') return 'Activo'
    if (status === 'draft') return 'Borrador'
    return 'Cerrado'
}

export function commissionStatusToApi(status: 'Activa' | 'Programada' | 'Cerrada'): 'active' | 'scheduled' | 'closed' {
    if (status === 'Activa') return 'active'
    if (status === 'Programada') return 'scheduled'
    return 'closed'
}
export function commissionStatusFromApi(status: 'active' | 'scheduled' | 'closed'): 'Activa' | 'Programada' | 'Cerrada' {
    if (status === 'active') return 'Activa'
    if (status === 'scheduled') return 'Programada'
    return 'Cerrada'
}

export function enrollmentStatusToApi(status: 'Activo' | 'Pausado' | 'Finalizado' | 'Baja'): 'active' | 'paused' | 'finished' | 'dropped' {
    if (status === 'Activo') return 'active'
    if (status === 'Pausado') return 'paused'
    if (status === 'Finalizado') return 'finished'
    return 'dropped'
}
export function enrollmentStatusFromApi(status: 'active' | 'paused' | 'finished' | 'dropped'): 'Activo' | 'Pausado' | 'Finalizado' | 'Baja' {
    if (status === 'active') return 'Activo'
    if (status === 'paused') return 'Pausado'
    if (status === 'finished') return 'Finalizado'
    return 'Baja'
}
