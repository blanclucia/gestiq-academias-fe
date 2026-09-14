const fixedRoutes: Record<string, string> = {
    '/dashboard': '/puentes/admin', '/agenda': '/puentes/admin/schedule', '/students': '/puentes/admin/students', '/offers': '/puentes/admin/offers', '/payments': '/puentes/admin/billing', '/finances': '/puentes/admin/finances',
    '/my-profile': '/puentes/admin/profile', '/my-settings': '/puentes/admin/profile', '/my-academy': '/puentes/admin/academy', '/my-sedes': '/puentes/admin/branches', '/my-sedes/listado': '/puentes/admin/branches/list',
    '/teacher/classes': '/puentes/teacher/classes', '/teacher/attendance': '/puentes/teacher/attendance', '/teacher/schedule': '/puentes/teacher/schedule',
    '/student/courses': '/puentes/student/courses', '/student/calendar': '/puentes/student/calendar', '/student/payments': '/puentes/student/payments',
}

export function getLegacyRedirect(pathname: string, search = ''): string | null {
    const fixed = fixedRoutes[pathname]
    if (fixed) return `${fixed}${search}`
    if (pathname.startsWith('/students/')) return `/puentes/admin/students/${pathname.slice('/students/'.length)}${search}`
    if (pathname.startsWith('/offers/')) return `/puentes/admin/offers/${pathname.slice('/offers/'.length)}${search}`
    if (pathname.startsWith('/my-sedes/')) return `/puentes/admin/branches/${pathname.slice('/my-sedes/'.length)}${search}`
    if (pathname.startsWith('/inscripcion/')) return `/puentes/enrollments/${pathname.slice('/inscripcion/'.length)}${search}`
    if (pathname.startsWith('/pago/')) return `/puentes/payments/${pathname.slice('/pago/'.length)}${search}`
    const [, organizationSlug, mode, ...segments] = pathname.split('/')
    if (organizationSlug && mode === 'inscripciones' && segments.length > 0) return `/${organizationSlug}/enrollments/${segments.join('/')}${search}`
    if (organizationSlug && mode === 'pagos' && segments.length > 0) return `/${organizationSlug}/payments/${segments.join('/')}${search}`
    if (organizationSlug && ['admin', 'profe', 'alumno'].includes(mode)) {
        const canonicalMode = mode === 'profe' ? 'teacher' : mode === 'alumno' ? 'student' : 'admin'
        const suffix = normalizeWorkspacePath(segments.join('/'))
        return `/${organizationSlug}/${canonicalMode}${suffix ? `/${suffix}` : ''}${search}`
    }
    return null
}
import { normalizeWorkspacePath } from './workspaceRoutes'
