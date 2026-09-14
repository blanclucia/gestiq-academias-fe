import { useState, type ReactNode } from 'react'
import { RoleContext } from './RoleContext'
import { demoAssignedRoles, type UserRole } from './roleTypes'

const storageKey = 'gestiq-active-role'

type RoleProviderProps = { children: ReactNode; role?: UserRole; availableRoles?: UserRole[] }

export function RoleProvider({ children, role, availableRoles = demoAssignedRoles }: RoleProviderProps) {
    const [activeRole, setActiveRoleState] = useState<UserRole>(() => {
        if (typeof window === 'undefined') return 'admin'
        const stored = window.localStorage.getItem(storageKey) as UserRole | null
        return role ?? (stored && availableRoles.includes(stored) ? stored : availableRoles[0] ?? 'admin')
    })

    const setActiveRole = (role: UserRole) => {
        if (!availableRoles.includes(role)) return
        window.localStorage.setItem(storageKey, role)
        setActiveRoleState(role)
    }

    return <RoleContext.Provider value={{ activeRole: role ?? activeRole, availableRoles, setActiveRole }}>{children}</RoleContext.Provider>
}
