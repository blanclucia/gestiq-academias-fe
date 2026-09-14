import { useEffect, useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileBottomNav } from './MobileBottomNav'

type AppShellProps = {
    children: ReactNode
    onLogout?: () => void
}

export function AppShell({ children, onLogout }: AppShellProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false
        const saved = window.localStorage.getItem('gestiq-sidebar-collapsed')
        return saved ? saved === 'true' : false
    })
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window === 'undefined') return false
        return window.localStorage.getItem('gestiq-dark-mode') === 'true'
    })
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 980 : false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode)
        document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light'
        window.localStorage.setItem('gestiq-dark-mode', String(darkMode))
    }, [darkMode])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('gestiq-sidebar-collapsed', String(sidebarCollapsed))
        }
    }, [sidebarCollapsed])

    useEffect(() => {
        const handleResize = () => {
            const nextIsMobile = window.innerWidth <= 980
            const wasMobile = isMobile

            setIsMobile(nextIsMobile)

            if (nextIsMobile) {
                setSidebarCollapsed(false)
                setMobileMenuOpen(false)
                return
            }

            if (wasMobile && !nextIsMobile) {
                setMobileMenuOpen(false)
            }
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [isMobile])

    const handleToggleSidebar = () => {
        if (isMobile) {
            setMobileMenuOpen((value) => !value)
            return
        }

        setSidebarCollapsed((value) => !value)
    }

    const handleSidebarNavigate = () => {
        if (isMobile) {
            setMobileMenuOpen(false)
        }
    }

    return (
        <div className="app-shell">
            {isMobile && mobileMenuOpen && (
                <button
                    type="button"
                    className="mobile-backdrop"
                    aria-label="Cerrar menú"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <Sidebar
                collapsed={isMobile ? false : sidebarCollapsed}
                mobileOpen={isMobile ? mobileMenuOpen : true}
                onClose={isMobile ? () => setMobileMenuOpen(false) : undefined}
                isMobile={isMobile}
                onNavigate={handleSidebarNavigate}
            />
            <div className="content-shell">
                <TopBar
                    collapsed={sidebarCollapsed}
                    darkMode={darkMode}
                    onToggleSidebar={handleToggleSidebar}
                    onToggleDarkMode={() => setDarkMode((value) => !value)}
                    onLogout={onLogout}
                />
                <main className="page-content">{children}</main>
            </div>
            <MobileBottomNav menuOpen={mobileMenuOpen} onToggleMenu={() => setMobileMenuOpen((value) => !value)} />
        </div>
    )
}
