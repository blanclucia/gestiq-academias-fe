import { Navigate, Outlet } from 'react-router-dom'
import type { UserRole } from '@/auth/roleTypes'
import { useActiveRole } from '@/auth/RoleContext'
import { useWorkspace } from './useWorkspace'

export function RequireRole({ role }: { role: UserRole }) {
    const { activeRole } = useActiveRole()
    const { path } = useWorkspace()
    return activeRole === role ? <Outlet /> : <Navigate to={path()} replace />
}
