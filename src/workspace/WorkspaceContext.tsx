import { useLayoutEffect, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { resolveWorkspace, sessionRole } from './organizationResolver'
import { isWorkspaceMode, roleByMode } from './workspaceTypes'
import { normalizeWorkspacePath, workspacePath } from './workspaceRoutes'
import { WorkspaceContext } from './useWorkspace'
import { setActiveOrganizationId } from './organizationScope'

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const { session } = useAuth()
    const { organizationSlug = '', mode: modeParam } = useParams()
    const { pathname, search } = useLocation()
    useLayoutEffect(() => {
        if (session) setActiveOrganizationId(session.organization.id)
        return () => setActiveOrganizationId('anonymous')
    }, [session])
    if (!session) return null
    const resolved = resolveWorkspace(session)
    if (organizationSlug !== session.organization.slug) return <div className="workspace-error" role="alert"><h1>Sin acceso a esta academia</h1><p>Tu sesión corresponde a {session.organization.name}.</p><Link to={workspacePath(session.organization.slug, sessionRole(session))}>Volver a mi academia</Link></div>
    if (!isWorkspaceMode(modeParam)) {
        const legacyRole = modeParam === 'profe' ? 'teacher' : modeParam === 'alumno' ? 'student' : sessionRole(session)
        const remainder = pathname.split('/').slice(3).join('/')
        return <Navigate to={`${workspacePath(organizationSlug, legacyRole, normalizeWorkspacePath(remainder))}${search}`} replace />
    }
    const role = roleByMode[modeParam]
    if (!resolved.membership.roles.includes(role)) return <Navigate to={workspacePath(organizationSlug, sessionRole(session))} replace />
    return <WorkspaceContext.Provider value={{ ...resolved, mode: modeParam, path: (path) => workspacePath(organizationSlug, role, path) }}>{children}</WorkspaceContext.Provider>
}
