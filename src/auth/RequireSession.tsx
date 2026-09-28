import { Navigate, useParams } from 'react-router-dom'
import { WorkspaceLayout } from '@/workspace/WorkspaceLayout'
import { defaultOrganizationSlug } from '@/services/http/client'
import { useAuth } from './AuthContext'
import { authErrorMessage } from './authErrors'

export function RequireSession() {
    const { phase, loading, error, session, retrySession, logout } = useAuth()
    const { organizationSlug } = useParams()
    if (phase !== 'signed-in') return <Navigate to={`/login?organization=${encodeURIComponent(organizationSlug || defaultOrganizationSlug)}`} replace />
    if (loading) return <div className="workspace-loading" role="status">Cargando tu sesión…</div>
    if (error || !session) return <div className="workspace-error" role="alert"><h1>No pudimos cargar tu sesión</h1><p>{authErrorMessage(error)}</p><button className="primary-button" onClick={retrySession}>Reintentar</button><button className="secondary-button" onClick={() => { void logout() }}>Volver al ingreso</button></div>
    return <WorkspaceLayout onLogout={() => { void logout() }} />
}
