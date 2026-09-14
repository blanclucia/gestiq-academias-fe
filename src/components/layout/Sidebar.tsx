import { BarChart3, ChevronRight, ExternalLink } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAcademyBrand } from '../../theme/AcademyBrandContext'
import { useAppBrand } from '../../theme/AppBrandContext'
import { useActiveRole } from '@/auth/RoleContext'
import { roleLabels } from '@/auth/roleTypes'
import { navigationByRole } from '@/auth/roleNavigation'
import { useWorkspace } from '@/workspace/useWorkspace'

type NavItem = {
    label: string
    path: string
    icon: typeof BarChart3
    active?: boolean
    showArrow?: boolean
}

type SidebarGroup = {
    title: string
    items: NavItem[]
}

type SidebarProps = {
    collapsed?: boolean
    mobileOpen?: boolean
    onClose?: () => void
    isMobile?: boolean
    onNavigate?: () => void
}

export function Sidebar({ collapsed = false, mobileOpen = true, onClose, isMobile = false, onNavigate }: SidebarProps) {
    const { brand } = useAcademyBrand()
    const { config } = useAppBrand()
    const { activeRole } = useActiveRole()
    const { path: workspacePath } = useWorkspace()
    const sidebarGroups: SidebarGroup[] = [{ title: roleLabels[activeRole].toUpperCase(), items: navigationByRole[activeRole] }]

    const academyName = config.visibleName || brand.name
    const brandMark = config.logoText || brand.shortName || brand.name.charAt(0).toUpperCase()
    const platformName = config.platformName || 'GestIQ'
    const websiteUrl = config.websiteUrl || 'https://gestiq.com.ar'

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : 'mobile-hidden'}`}>
            {isMobile && onClose && (
                <button type="button" className="mobile-sidebar-close" aria-label="Cerrar menú" onClick={onClose}>
                    ×
                </button>
            )}

            <div className="brand-row">
                <div className={`brand-mark ${brand.logoDataUrl ? 'has-image' : ''}`}>
                    {brand.logoDataUrl ? <img src={brand.logoDataUrl} alt={`Logo de ${academyName}`} /> : brandMark}
                </div>
                {!collapsed && <div className="brand-name">{academyName}</div>}
            </div>

            <nav className="sidebar-nav" aria-label="Main navigation">
                {sidebarGroups.map((group) => (
                    <div key={group.title} className="nav-group">
                        {!collapsed && <div className="nav-group-title">{group.title}</div>}

                        {group.items.map(({ label, path, icon: Icon, showArrow }) => (
                            <NavLink
                                key={label}
                                to={workspacePath(path)}
                                end={!path}
                                onClick={onNavigate}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                title={collapsed ? label : undefined}
                            >
                                <span className="nav-icon">
                                    <Icon size={18} />
                                </span>
                                {!collapsed && <span>{label}</span>}
                                {!collapsed && showArrow && (
                                    <span className="nav-arrow">
                                        <ChevronRight size={16} />
                                    </span>
                                )}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            <a
                href={websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="sidebar-brand-footer"
                title={collapsed ? `${platformName} website` : undefined}
            >
                <div className="sidebar-brand-badge" aria-hidden="true">
                    {platformName.charAt(0).toUpperCase()}
                </div>
                {!collapsed && (
                    <div className="sidebar-brand-meta-wrap">
                        <div className="sidebar-brand-meta">{platformName}</div>
                        <div className="sidebar-brand-link">
                            {websiteUrl.replace(/^https?:\/\//, '')}
                            <ExternalLink size={12} />
                        </div>
                    </div>
                )}
            </a>
        </aside>
    )
}
