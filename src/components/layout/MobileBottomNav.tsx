import { MoreHorizontal } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useActiveRole } from '@/auth/RoleContext'
import { navigationByRole } from '@/auth/roleNavigation'
import { useWorkspace } from '@/workspace/useWorkspace'

type MobileBottomNavProps = {
    menuOpen: boolean
    onToggleMenu: () => void
}

export function MobileBottomNav({ menuOpen, onToggleMenu }: MobileBottomNavProps) {
    const { pathname } = useLocation()
    const { activeRole } = useActiveRole()
    const { path: workspacePath } = useWorkspace()
    const primaryItems = navigationByRole[activeRole].slice(0, 4)
    const moreIsActive = menuOpen || pathname.includes('/academy') || pathname.includes('/branches') || pathname.includes('/profile')

    return <nav className="mobile-bottom-nav" aria-label="Navegación principal móvil">
        {primaryItems.map(({ shortLabel, path, icon: Icon }) => (
            <NavLink key={path || 'dashboard'} to={workspacePath(path)} end={!path} className={({ isActive }) => isActive ? 'active' : undefined}>
                <Icon size={20} />
                <span>{shortLabel}</span>
            </NavLink>
        ))}
        <button type="button" className={moreIsActive ? 'active' : undefined} aria-expanded={menuOpen} onClick={onToggleMenu}>
            <MoreHorizontal size={21} />
            <span>Más</span>
        </button>
    </nav>
}
