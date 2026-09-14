export type UserRole = 'admin' | 'teacher' | 'student'
export type AdministrativeLevel = 'owner' | 'branch_admin'

export const roleLabels: Record<UserRole, string> = {
    admin: 'Administración',
    teacher: 'Profesor',
    student: 'Estudiante',
}

export const demoAssignedRoles: UserRole[] = ['admin', 'teacher', 'student']

// El nivel administrativo define permisos; no es un modo seleccionable.
export const demoAdministrativeLevel: AdministrativeLevel = 'owner'
