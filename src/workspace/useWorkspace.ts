import { createContext, useContext } from 'react'
import type { ResolvedWorkspace } from './organizationResolver'
import type { WorkspaceMode } from './workspaceTypes'

export type WorkspaceContextValue = ResolvedWorkspace & { mode: WorkspaceMode; path: (path?: string) => string }
export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function useWorkspace() {
    const context = useContext(WorkspaceContext)
    if (!context) throw new Error('useWorkspace debe utilizarse dentro de WorkspaceProvider')
    return context
}
