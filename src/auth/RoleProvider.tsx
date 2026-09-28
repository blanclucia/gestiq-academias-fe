import type { ReactNode } from 'react'
import { RoleContext } from './RoleContext'
import type { UserRole } from './roleTypes'

// The URL chooses a display mode; available modes always come from the server.
export function RoleProvider({ children, role, availableRoles }: { children: ReactNode; role: UserRole; availableRoles: UserRole[] }) {
    return <RoleContext.Provider value={{ activeRole: role, availableRoles }}>{children}</RoleContext.Provider>
}
