import { Building2 } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { useBranches, useSelectedBranchId } from '@/services/branchRepository'
import { useWorkspace } from '@/workspace/useWorkspace'

// Sin una sede seleccionada, Alumnos/Ofertas académicas/Egresos/Dashboard se ven vacíos sin que se
// entienda por qué (branchId es la dimensión de la que cuelga casi todo). Este banner explica la
// causa apenas se entra a cualquier pantalla, en vez de que el usuario tenga que descubrirlo
// pantalla por pantalla o recién al chocar con el error al intentar crear algo.
export function NoBranchBanner() {
    const { session } = useAuth()
    const { path } = useWorkspace()
    const location = useLocation()
    const { branches, isLoading } = useBranches()
    const selectedBranchId = useSelectedBranchId()

    if (isLoading || selectedBranchId || location.pathname.includes('/branches')) return null

    const canCreateBranch = session?.permissions.includes('branches.create') ?? false

    if (branches.length === 0) {
        if (!canCreateBranch) {
            return (
                <div className="inline-warning-banner" role="status">
                    <Building2 size={16} />
                    <span>Todavía no hay ninguna sede disponible en esta organización. Pedile al administrador que cree una.</span>
                </div>
            )
        }
        return (
            <div className="inline-warning-banner" role="status">
                <Building2 size={16} />
                <span>Todavía no creaste ninguna sede — es la base de todo lo demás (alumnos, cursos, egresos). Creá la primera para empezar a cargar datos.</span>
                <Link to={path('sedes')} className="primary-button compact-button">Crear sede</Link>
            </div>
        )
    }

    // El selector global solo ofrece sedes activas; si están todas inactivas no hay nada para elegir.
    if (!branches.some((branch) => branch.status === 'Activa')) {
        return (
            <div className="inline-warning-banner" role="status">
                <Building2 size={16} />
                <span>{session?.permissions.includes('branches.update') ? 'Todas las sedes están inactivas. Activá una para ver y cargar datos.' : 'No hay ninguna sede activa en esta organización. Pedile al administrador que active una.'}</span>
                {session?.permissions.includes('branches.update') && <Link to={path('sedes')} className="primary-button compact-button">Ver sedes</Link>}
            </div>
        )
    }

    return (
        <div className="inline-warning-banner" role="status">
            <Building2 size={16} />
            <span>No tenés ninguna sede seleccionada. Elegí una arriba a la izquierda para ver y cargar datos.</span>
        </div>
    )
}
