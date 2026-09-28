import type { Session } from '@/auth/api/contracts'
import type { UserRole } from '@/auth/roleTypes'
import type { Membership, Organization } from './workspaceTypes'

export type ResolvedWorkspace = { organization: Organization; membership: Membership }
const modeRoles = { ADMINISTRATION: 'admin', TEACHER: 'teacher', STUDENT: 'student' } as const
export function sessionRoles(session: Session): UserRole[] {
    return session.availableModes.map((mode) => modeRoles[mode]).filter((role) => session.roles.includes(role))
}
export function sessionRole(session: Session): UserRole {
    const roles = sessionRoles(session)
    return roles.includes(modeRoles[session.activeMode]) ? modeRoles[session.activeMode] : roles[0]
}
export function resolveWorkspace(session: Session): ResolvedWorkspace {
    return {
        organization: { ...session.organization, product: session.organization.productType },
        membership: { organizationId: session.organization.id, userId: session.user.id, roles: sessionRoles(session), branchIds: session.administrativeAccess?.branchIds ?? [] },
    }
}
