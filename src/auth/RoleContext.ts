import { createContext, useContext } from 'react'
import type { UserRole } from './roleTypes'

export type RoleContextValue = {
    activeRole: UserRole
    availableRoles: UserRole[]
}

export const RoleContext = createContext<RoleContextValue | null>(null)

export function useActiveRole() {
    const context = useContext(RoleContext)
    if (!context) throw new Error('useActiveRole debe utilizarse dentro de RoleProvider')
    return context
}
