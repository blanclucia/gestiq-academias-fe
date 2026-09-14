import type { UserRole } from '@/auth/roleTypes'

export type ProductType = 'academy' | 'gym'
export type WorkspaceMode = 'admin' | 'teacher' | 'student'

export type Organization = {
    id: string
    slug: string
    name: string
    product: ProductType
}

export type Membership = {
    organizationId: string
    userId: string
    roles: UserRole[]
    branchIds: string[]
}

export const roleByMode: Record<WorkspaceMode, UserRole> = { admin: 'admin', teacher: 'teacher', student: 'student' }
export const modeByRole: Record<UserRole, WorkspaceMode> = { admin: 'admin', teacher: 'teacher', student: 'student' }

export function isWorkspaceMode(value: string | undefined): value is WorkspaceMode {
    return value === 'admin' || value === 'teacher' || value === 'student'
}
