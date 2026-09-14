import { Navigate, useLocation } from 'react-router-dom'
import { getLegacyRedirect } from './legacyRouteRedirect'

export function LegacyRedirect({ authenticated }: { authenticated: boolean }) {
    const { pathname, search } = useLocation()
    return <Navigate to={getLegacyRedirect(pathname, search) ?? (authenticated ? '/puentes/admin' : '/login')} replace />
}
