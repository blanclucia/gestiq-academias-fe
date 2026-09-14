import { describe, expect, it } from 'vitest'
import { getLegacyRedirect } from './legacyRouteRedirect'
import { workspacePath } from './workspaceRoutes'

describe('workspace routes', () => {
    it('includes organization and mode in internal links', () => {
        expect(workspacePath('puentes', 'admin', 'students/ST-1001')).toBe('/puentes/admin/students/ST-1001')
        expect(workspacePath('puentes', 'teacher')).toBe('/puentes/teacher')
        expect(workspacePath('puentes', 'admin', 'alumnos/ST-1001')).toBe('/puentes/admin/students/ST-1001')
    })

    it('migrates legacy deep links and query parameters', () => {
        expect(getLegacyRedirect('/offers/COURSE-1/commissions/COM-1', '?tab=students')).toBe('/puentes/admin/offers/COURSE-1/commissions/COM-1?tab=students')
        expect(getLegacyRedirect('/inscripcion/ingles-2027')).toBe('/puentes/enrollments/ingles-2027')
        expect(getLegacyRedirect('/puentes/profe/clases')).toBe('/puentes/teacher/classes')
        expect(getLegacyRedirect('/puentes/admin/alumnos')).toBe('/puentes/admin/students')
    })
})
