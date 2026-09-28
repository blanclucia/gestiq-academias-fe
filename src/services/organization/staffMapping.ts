export function staffRoleToApi(role: 'Docente' | 'Administrativo'): 'teacher' | 'administrative' {
    return role === 'Docente' ? 'teacher' : 'administrative'
}
export function staffRoleFromApi(role: 'teacher' | 'administrative'): 'Docente' | 'Administrativo' {
    return role === 'teacher' ? 'Docente' : 'Administrativo'
}
export function staffStatusToApi(status: 'Activo' | 'Inactivo'): 'active' | 'inactive' {
    return status === 'Activo' ? 'active' : 'inactive'
}
export function staffStatusFromApi(status: 'active' | 'inactive'): 'Activo' | 'Inactivo' {
    return status === 'active' ? 'Activo' : 'Inactivo'
}
