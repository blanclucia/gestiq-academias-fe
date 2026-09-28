export type UserRole = 'admin' | 'teacher' | 'student'
export type AdministrativeLevel = 'owner' | 'branch_admin'

export const roleLabels: Record<UserRole, string> = {
    admin: 'Administración',
    teacher: 'Profesor',
    student: 'Estudiante',
}
