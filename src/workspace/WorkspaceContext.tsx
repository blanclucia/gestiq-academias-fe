import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { organizationResolver, type ResolvedWorkspace } from './organizationResolver'
import { isWorkspaceMode, roleByMode } from './workspaceTypes'
import { normalizeWorkspacePath, workspacePath } from './workspaceRoutes'
import { WorkspaceContext } from './useWorkspace'
import { setActiveOrganizationId } from './organizationScope'

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const { organizationSlug = '', mode: modeParam } = useParams()
    const { pathname, search } = useLocation()
    const [resolution, setResolution] = useState<{ slug: string; value: ResolvedWorkspace | null } | null>(null)

    useEffect(() => {
        let active = true
        void organizationResolver.findBySlug(organizationSlug).then((result) => { if (active) setResolution({ slug: organizationSlug, value: result }) })
        return () => { active = false }
    }, [organizationSlug])

    if (!isWorkspaceMode(modeParam)) {
        const legacyRole = modeParam === 'profe' ? 'teacher' : modeParam === 'alumno' ? 'student' : 'admin'
        const remainder = pathname.split('/').slice(3).join('/')
        return <Navigate to={`${workspacePath(organizationSlug, legacyRole, normalizeWorkspacePath(remainder))}${search}`} replace />
    }
    const resolved = resolution?.slug === organizationSlug ? resolution.value : undefined
    if (resolved === undefined) return <div className="workspace-loading">Cargando organización…</div>
    if (!resolved) return <div className="workspace-error"><h1>Organización no encontrada</h1><p>Revisá la dirección o volvé a iniciar sesión.</p></div>
    setActiveOrganizationId(resolved.organization.id)
    const role = roleByMode[modeParam]
    if (!resolved.membership.roles.includes(role)) return <Navigate to={workspacePath(organizationSlug, resolved.membership.roles[0])} replace />

    return <WorkspaceContext.Provider value={{ ...resolved, mode: modeParam, path: (path) => workspacePath(organizationSlug, role, path) }}>{children}</WorkspaceContext.Provider>
}
