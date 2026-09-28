import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authClient, type AuthClient } from './api/authClient'
import { AuthContext } from './AuthContext'
import { setActiveOrganizationId } from '@/workspace/organizationScope'

export function AuthProvider({ children, client = authClient }: { children: ReactNode; client?: AuthClient }) {
    const state = useSyncExternalStore(client.subscribe, client.getSnapshot)
    const cache = useQueryClient()
    const [logoutMessage, setLogoutMessage] = useState('')
    const session = useQuery({
        queryKey: ['session', state.generation],
        queryFn: async ({ signal }) => {
            const value = await client.session(signal)
            setActiveOrganizationId(value.organization.id)
            return value
        },
        enabled: state.phase === 'signed-in', retry: false,
        refetchInterval: 60000, staleTime: 15000, refetchOnWindowFocus: 'always',
    })
    useEffect(() => client.subscribe(() => {
        if (client.getSnapshot().phase === 'anonymous') { setActiveOrganizationId('anonymous'); cache.clear() }
    }), [client, cache])
    useEffect(() => {
        if (state.phase !== 'password-change') return
        const timer = setTimeout(() => client.clear(), Math.max(0, state.challengeExpiresAt! - Date.now()))
        return () => clearTimeout(timer)
    }, [client, state])
    const logout = async () => {
        setLogoutMessage('')
        try { await client.logout() }
        catch { setLogoutMessage('Saliste de esta pestaña, pero no pudimos confirmar el cierre en el servidor. La sesión remota vencerá automáticamente.') }
    }
    return <AuthContext.Provider value={{ client, phase: state.phase, session: state.phase === 'signed-in' ? session.data ?? null : null, loading: state.phase === 'signed-in' && session.isPending, error: session.error, logoutMessage, logout, retrySession: () => { void session.refetch() } }}>{children}</AuthContext.Provider>
}
