import {
    Bell,
    Building2,
    ChevronDown,
    Globe,
    GraduationCap,
    LogOut,
    Moon,
    PanelLeftClose,
    PanelLeftOpen,
    SunMedium,
    UserCircle2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { listAccessibleBranches, setSelectedBranchId, useBranchRepositoryVersion, useSelectedBranchId } from '@/services/branchRepository'
import { useAcademyBrand } from '@/theme/AcademyBrandContext'
import { useAppBrand } from '@/theme/AppBrandContext'
import { RoleSwitcher } from './RoleSwitcher'
import { useActiveRole } from '@/auth/RoleContext'
import { demoAdministrativeLevel } from '@/auth/roleTypes'
import { useWorkspace } from '@/workspace/useWorkspace'

type TopBarProps = {
    collapsed?: boolean
    darkMode?: boolean
    onToggleSidebar?: () => void
    onToggleDarkMode?: () => void
    onLogout?: () => void
}

export function TopBar({
    collapsed = false,
    darkMode = false,
    onToggleSidebar,
    onToggleDarkMode,
    onLogout,
}: TopBarProps) {
    useBranchRepositoryVersion()
    const { brand } = useAcademyBrand()
    const { activeRole } = useActiveRole()
    const { path: workspacePath } = useWorkspace()
    const location = useLocation()
    const navigate = useNavigate()
    const { config } = useAppBrand()
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [academyMenuOpen, setAcademyMenuOpen] = useState(false)
    const academyMenuRef = useRef<HTMLDivElement>(null)
    const userMenuRef = useRef<HTMLDivElement>(null)
    const branches = listAccessibleBranches(activeRole, demoAdministrativeLevel === 'owner')
    const selectedBranchId = useSelectedBranchId()
    const selectedBranch = branches.find((branch) => branch.id === selectedBranchId) ?? branches[0]
    const selectedAcademy = selectedBranch?.name ?? 'Sin sede activa'
    const academyName = config.visibleName || brand.name
    const academyMark = config.logoText || brand.shortName || brand.name.charAt(0).toUpperCase()

    useEffect(() => {
        const closeOutside = (event: PointerEvent) => {
            const target = event.target as Node
            if (!academyMenuRef.current?.contains(target)) setAcademyMenuOpen(false)
            if (!userMenuRef.current?.contains(target)) setUserMenuOpen(false)
        }
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setAcademyMenuOpen(false)
                setUserMenuOpen(false)
            }
        }
        document.addEventListener('pointerdown', closeOutside)
        document.addEventListener('keydown', closeOnEscape)
        return () => {
            document.removeEventListener('pointerdown', closeOutside)
            document.removeEventListener('keydown', closeOnEscape)
        }
    }, [])

    return (
        <header className="topbar">
            <div className="mobile-topbar-brand">
                <span className={brand.logoDataUrl ? 'has-image' : ''}>{brand.logoDataUrl ? <img src={brand.logoDataUrl} alt="" /> : academyMark}</span>
                <strong>{academyName}</strong>
            </div>
            <div className="topbar-search-wrap">
                <button
                    type="button"
                    className="search-toggle"
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    onClick={onToggleSidebar}
                >
                    {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                </button>

                <RoleSwitcher />

                <div className="academy-picker-wrap context-picker-wrap" ref={academyMenuRef}>
                    <button
                        type="button"
                        className="academy-picker context-picker"
                        aria-label="Seleccionar academia"
                        onClick={() => setAcademyMenuOpen((value) => !value)}
                    >
                        <span className="academy-picker-icon context-picker-icon">
                            <Building2 size={15} />
                        </span>
                        <span className="academy-picker-text context-picker-label">{selectedAcademy}</span>
                        <ChevronDown size={14} />
                    </button>

                    {academyMenuOpen && (
                        <div className="academy-menu context-picker-menu" role="menu" aria-label="Academias disponibles">
                            {branches.map((branch) => (
                                <button
                                    key={branch.id}
                                    type="button"
                                    className={`academy-menu-item ${selectedAcademy === branch.name ? 'active' : ''}`}
                                    role="menuitem"
                                    onClick={() => {
                                        setSelectedBranchId(branch.id)
                                        if (location.pathname.includes('/branches/')) navigate(workspacePath(`branches/${branch.id}`))
                                        setAcademyMenuOpen(false)
                                    }}
                                >
                                    <span>{branch.name}</span>
                                    {selectedAcademy === branch.name && <span className="academy-menu-check">✓</span>}
                                </button>
                            ))}
                            {branches.length === 0 && <span className="academy-menu-item">No hay sedes activas</span>}
                        </div>
                    )}
                </div>

            </div>

            <div className="topbar-actions">
                <button
                    type="button"
                    className="icon-button topbar-secondary-action"
                    aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    onClick={onToggleDarkMode}
                >
                    {darkMode ? <SunMedium size={15} /> : <Moon size={15} />}
                </button>

                <button type="button" className="icon-button topbar-secondary-action" aria-label="Language">
                    <Globe size={15} />
                </button>

                <button type="button" className="icon-button topbar-secondary-action" aria-label="Notifications">
                    <Bell size={15} />
                </button>

                <div className="user-menu" ref={userMenuRef}>
                    <button
                        type="button"
                        className="user-trigger"
                        aria-label="User menu"
                        onClick={() => setUserMenuOpen((value) => !value)}
                    >
                        <span className="user-avatar">L</span>
                        <ChevronDown size={14} />
                    </button>

                    {userMenuOpen && (
                        <div className="user-panel" role="menu" aria-label="User options">
                            <Link to={workspacePath('perfil')} className="user-panel-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                                <UserCircle2 size={16} />
                                <span>Mi perfil</span>
                            </Link>
                            <Link to={workspacePath('academia')} className="user-panel-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                                <GraduationCap size={16} />
                                <span>Mi academia</span>
                            </Link>
                            <Link to={workspacePath('sedes')} className="user-panel-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                                <Building2 size={16} />
                                <span>Mis sedes</span>
                            </Link>
                            <button type="button" className="user-panel-item mobile-theme-menu-item" role="menuitem" onClick={() => { onToggleDarkMode?.(); setUserMenuOpen(false) }}>
                                {darkMode ? <SunMedium size={16} /> : <Moon size={16} />}
                                <span>{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>
                            </button>
                            <button type="button" className="user-panel-item danger" role="menuitem" onClick={onLogout}>
                                <LogOut size={16} />
                                <span>Cerrar sesión</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
