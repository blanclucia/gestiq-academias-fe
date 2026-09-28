import type { UserRole } from './roleTypes'

const adminModules: Record<string, string> = {
    schedule: 'attendance.manage', students: 'students.read', offers: 'offers.manage',
    billing: 'payments.read', finances: 'reports.read', academy: 'academy.update', branches: 'branches.update',
}
// UI visibility only. The API remains responsible for granting access to every resource.
export function canOpenModule(role: UserRole, path: string, permissions: string[]) {
    const permission = role === 'admin' ? adminModules[path.split('/')[0]] : undefined
    return !permission || permissions.includes(permission)
}
