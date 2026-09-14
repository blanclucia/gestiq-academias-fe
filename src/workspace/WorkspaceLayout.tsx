import { Outlet } from 'react-router-dom'
import { RoleProvider } from '@/auth/RoleProvider'
import { AppShell } from '@/components/layout/AppShell'
import { WorkspaceProvider } from './WorkspaceContext'
import { useWorkspace } from './useWorkspace'
import { roleByMode } from './workspaceTypes'

function WorkspaceShell({ onLogout }: { onLogout: () => void }) {
    const { membership, mode } = useWorkspace()
    return <RoleProvider role={roleByMode[mode]} availableRoles={membership.roles}><AppShell onLogout={onLogout}><Outlet /></AppShell></RoleProvider>
}

export function WorkspaceLayout({ onLogout }: { onLogout: () => void }) {
    return <WorkspaceProvider><WorkspaceShell onLogout={onLogout} /></WorkspaceProvider>
}
