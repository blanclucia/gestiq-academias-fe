import { createContext, useContext } from 'react'
import type { AuthClient } from './api/authClient'
import type { Session } from './api/contracts'

export type AuthContextValue = {
    client: AuthClient
    phase: 'anonymous' | 'password-change' | 'signed-in'
    session: Session | null
    loading: boolean
    error: unknown
    logoutMessage: string
    logout: () => Promise<void>
    retrySession: () => void
}
export const AuthContext = createContext<AuthContextValue | null>(null)
export function useAuth() {
    const value = useContext(AuthContext)
    if (!value) throw new Error('useAuth requiere AuthProvider')
    return value
}
