export function studentStatusToApi(status: 'Activo' | 'Pendiente' | 'Inactivo'): 'active' | 'pending' | 'inactive' {
    if (status === 'Activo') return 'active'
    if (status === 'Pendiente') return 'pending'
    return 'inactive'
}
export function studentStatusFromApi(status: 'active' | 'pending' | 'inactive'): 'Activo' | 'Pendiente' | 'Inactivo' {
    if (status === 'active') return 'Activo'
    if (status === 'pending') return 'Pendiente'
    return 'Inactivo'
}
