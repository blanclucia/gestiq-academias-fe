import type { UserRole } from '@/auth/roleTypes'
import { modeByRole } from './workspaceTypes'

export const modulePaths = {
    dashboard: '', agenda: 'schedule', students: 'students', offers: 'offers', billing: 'billing', finances: 'finances',
    academy: 'academy', branches: 'branches', branchList: 'branches/list', profile: 'profile',
    teacherClasses: 'classes', teacherAttendance: 'attendance', teacherSchedule: 'schedule',
    studentCourses: 'courses', studentCalendar: 'calendar', studentPayments: 'payments',
} as const

export function workspaceBase(slug: string, role: UserRole) {
    return `/${slug}/${modeByRole[role]}`
}

export function normalizeWorkspacePath(path: string) {
    const segmentAliases: Record<string, string> = {
        agenda: 'schedule', alumnos: 'students', oferta: 'offers', cobranzas: 'billing', finanzas: 'finances',
        academia: 'academy', sedes: 'branches', listado: 'list', perfil: 'profile', comisiones: 'commissions', inscripciones: 'enrollments',
        clases: 'classes', asistencia: 'attendance', cursos: 'courses', calendario: 'calendar', pagos: 'payments',
    }
    const [pathname, query] = path.replace(/^\//, '').split('?')
    const normalized = pathname.split('/').map((segment) => segmentAliases[segment] ?? segment).join('/')
    return query === undefined ? normalized : `${normalized}?${query}`
}

export function workspacePath(slug: string, role: UserRole, path = '') {
    const base = workspaceBase(slug, role)
    const suffix = normalizeWorkspacePath(path)
    return suffix ? `${base}/${suffix}` : base
}
