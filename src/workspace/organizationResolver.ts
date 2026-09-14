import { demoAssignedRoles } from '@/auth/roleTypes'
import type { Membership, Organization } from './workspaceTypes'

export type ResolvedWorkspace = { organization: Organization; membership: Membership }

export interface OrganizationResolver {
    findBySlug(slug: string): Promise<ResolvedWorkspace | null>
}

const demoWorkspace: ResolvedWorkspace = {
    organization: { id: 'org-puentes', slug: 'puentes', name: 'Academia Puentes', product: 'academy' },
    membership: { organizationId: 'org-puentes', userId: 'demo-user', roles: demoAssignedRoles, branchIds: ['BR-1001', 'BR-1002'] },
}

// This adapter is the only mock-specific piece. Replace its implementation with
// the future API call without changing providers, guards or pages.
export const organizationResolver: OrganizationResolver = {
    async findBySlug(slug) {
        return slug === demoWorkspace.organization.slug ? demoWorkspace : null
    },
}
