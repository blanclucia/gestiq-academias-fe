import { Navigate } from 'react-router-dom'
import { WorkspaceLayout } from '@/workspace/WorkspaceLayout'
import { useAuth } from './AuthContext'
import { authErrorMessage } from './authErrors'

export function RequireSession() {
    const { phase, loading, error, session, retrySession, logout } = useAuth()
    // Still trying a silent refresh from the cookie jar — don't redirect to /login yet, that
    // would flash the login form for a split second on every reload before bouncing back.
    if (phase === 'bootstrapping') return <div className="workspace-loading" role="status">Cargando tu sesión…</div>
    if (phase !== 'signed-in') return <Navigate to="/login" replace />
    if (loading) return <div className="workspace-loading" role="status">Cargando tu sesión…</div>
    if (error || !session) return <div className="workspace-error" role="alert"><h1>No pudimos cargar tu sesión</h1><p>{authErrorMessage(error)}</p><button className="primary-button" onClick={retrySession}>Reintentar</button><button className="secondary-button" onClick={() => { void logout() }}>Volver al ingreso</button></div>
    return <WorkspaceLayout onLogout={() => { void logout() }} />
}
