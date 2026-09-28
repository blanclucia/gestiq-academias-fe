import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { defaultOrganizationSlug } from '@/services/http/client'
import { sessionRole } from './organizationResolver'
import { workspacePath } from './workspaceRoutes'
import { getLegacyRedirect } from './legacyRouteRedirect'

export function LegacyRedirect() {
    const { pathname, search } = useLocation()
    const { session } = useAuth()
    const home = session ? workspacePath(session.organization.slug, sessionRole(session)) : '/login'
    const destination = getLegacyRedirect(pathname, search, session?.organization.slug || defaultOrganizationSlug)
    return <Navigate to={destination && destination !== `${pathname}${search}` ? destination : home} replace />
}
