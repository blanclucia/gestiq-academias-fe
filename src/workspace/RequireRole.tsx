import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { canOpenModule } from '@/auth/permissions'
import type { UserRole } from '@/auth/roleTypes'
import { useActiveRole } from '@/auth/RoleContext'
import { useWorkspace } from './useWorkspace'

export function RequireRole({ role }: { role: UserRole }) {
    const { session } = useAuth()
    const { pathname } = useLocation()
    const module = pathname.split('/').slice(3).join('/')
    const { activeRole } = useActiveRole()
    const { path } = useWorkspace()
    return activeRole === role && canOpenModule(role, module, session?.permissions ?? []) ? <Outlet /> : <Navigate to={path()} replace />
}
