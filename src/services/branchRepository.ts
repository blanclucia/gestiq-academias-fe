import { useSyncExternalStore } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/AuthContext'
import { readOrganizationStorageItem, writeOrganizationStorageItem } from '@/workspace/organizationScope'
import { assignBranchAdministratorApi, assignBranchStaffApi, createBranchApi, fetchBranches, revokeBranchAdministratorApi, revokeBranchStaffApi, updateBranchApi, type ApiBranch, type ApiBranchPatch } from '@/services/organization/branchesApi'
import { administersBranches, grantMemberRoleApi, revokeMemberRoleApi } from '@/services/organization/membersApi'
import { branchStatusFromApi, branchStatusToApi, generateDisplayCode, operatingToWeekDays, weekDaysToOperating } from '@/services/organization/branchesMapping'
import { getBranchRoster, setBranchRoster, type BranchRoster } from '@/services/organization/branchRoster'

export type AcademyBranch = {
    id: string
    name: string
    address: string
    email: string
    phone: string
    managerId: string
    managerIds: string[]
    staffIds: string[]
    studentIds: string[]
    weekDays: string[]
    openingTime: string
    closingTime: string
    studentsCount: number
    status: 'Activa' | 'Inactiva'
}

type BranchCoreFields = Pick<AcademyBranch, 'name' | 'address' | 'email' | 'phone' | 'weekDays' | 'openingTime' | 'closingTime' | 'status'>

const selectedBranchKey = 'gestiq-selected-branch-v1'
const selectionListeners = new Set<() => void>()

function withRoster(branch: ApiBranch): AcademyBranch {
    return {
        id: branch.id,
        name: branch.name,
        address: branch.address,
        email: branch.email,
        phone: branch.phone,
        openingTime: branch.openingTime,
        closingTime: branch.closingTime,
        weekDays: operatingToWeekDays(branch.operatingWeekdays),
        status: branchStatusFromApi(branch.status),
        ...getBranchRoster(branch.id),
    }
}

export function useBranches() {
    const { session } = useAuth()
    const organizationSlug = session?.organization.slug
    const query = useQuery({
        queryKey: ['branches', organizationSlug],
        queryFn: ({ signal }) => fetchBranches(organizationSlug!, signal),
        enabled: Boolean(organizationSlug),
    })
    return { branches: (query.data ?? []).map(withRoster), isLoading: query.isLoading, isError: query.isError, error: query.error }
}

export function useCreateBranch() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async (input: BranchCoreFields & Partial<BranchRoster>) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            const created = await createBranchApi(organizationSlug, {
                displayCode: generateDisplayCode(input.name),
                name: input.name,
                email: input.email,
                phone: input.phone,
                address: input.address,
                openingTime: input.openingTime,
                closingTime: input.closingTime,
                operatingWeekdays: weekDaysToOperating(input.weekDays),
                status: branchStatusToApi(input.status),
            })
            const roster = setBranchRoster(created.id, {
                managerIds: input.managerIds ?? [],
                staffIds: input.staffIds ?? [],
                studentIds: input.studentIds ?? [],
                managerId: input.managerId ?? input.managerIds?.[0] ?? '',
            })
            return { ...withRoster(created), ...roster }
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches', organizationSlug] }),
    })
}

export function useUpdateBranch() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async ({ id, changes }: { id: string; changes: Partial<AcademyBranch> }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            const corePatch: ApiBranchPatch = {}
            if (changes.name !== undefined) corePatch.name = changes.name
            if (changes.address !== undefined) corePatch.address = changes.address
            if (changes.email !== undefined) corePatch.email = changes.email
            if (changes.phone !== undefined) corePatch.phone = changes.phone
            if (changes.openingTime !== undefined) corePatch.openingTime = changes.openingTime
            if (changes.closingTime !== undefined) corePatch.closingTime = changes.closingTime
            if (changes.weekDays) corePatch.operatingWeekdays = weekDaysToOperating(changes.weekDays)
            if (changes.status) corePatch.status = branchStatusToApi(changes.status)
            if (Object.keys(corePatch).length > 0) await updateBranchApi(organizationSlug, id, corePatch)

            const { managerId, managerIds, staffIds, studentIds } = changes
            if (managerId !== undefined || managerIds || staffIds || studentIds) {
                setBranchRoster(id, {
                    ...(managerId !== undefined && { managerId }),
                    ...(managerIds && { managerIds }),
                    ...(staffIds && { staffIds }),
                    ...(studentIds && { studentIds }),
                })
            }
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches', organizationSlug] }),
    })
}

// Grants/revokes the real "admin" role and the real branch assignment, in the order the backend
// requires: role before assigning on enable, un-assign before revoking role on disable. Revoking
// "admin" can fail with member_administers_branches if the person still administers another
// active branch — that's expected, not an error, so the role stays as-is in that case.
export function useSetBranchAdministrator() {
    const { session } = useAuth()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async ({ branchId, userId, enabled }: { branchId: string; userId: string; enabled: boolean }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            if (enabled) {
                await grantMemberRoleApi(organizationSlug, userId, 'admin')
                await assignBranchAdministratorApi(organizationSlug, branchId, userId)
                return
            }
            await revokeBranchAdministratorApi(organizationSlug, branchId, userId)
            try {
                await revokeMemberRoleApi(organizationSlug, userId, 'admin')
            } catch (error) {
                if (!administersBranches(error)) throw error
            }
        },
    })
}

// Grants/revokes the teacher operational scope for a branch — separate from the "admin" role
// grant above, since staff.manage never validates the target's org roles (harmless per the
// backend's own design note: AvailableModes is what actually gates a teacher view).
export function useSetBranchStaffScope() {
    const { session } = useAuth()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async ({ branchId, userId, enabled }: { branchId: string; userId: string; enabled: boolean }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            if (enabled) {
                await assignBranchStaffApi(organizationSlug, branchId, userId)
                return
            }
            await revokeBranchStaffApi(organizationSlug, branchId, userId)
        },
    })
}

// Roster filtering by role stays client-side: staff/student membership per branch has no backend equivalent yet.
export function listAccessibleBranches(branches: AcademyBranch[], role: 'admin' | 'teacher' | 'student', isOwner: boolean, userId?: string) {
    const active = branches.filter((branch) => branch.status === 'Activa')
    const identityId = userId ?? (role === 'student' ? 'ST-1001' : 'T-101')
    if (role === 'admin') return isOwner ? active : active.filter((branch) => branch.managerIds.includes(identityId))
    if (role === 'teacher') return active.filter((branch) => branch.staffIds.includes(identityId))
    return active.filter((branch) => branch.studentIds.includes(identityId))
}

export function useSelectedBranchId() {
    return useSyncExternalStore((listener) => { selectionListeners.add(listener); return () => selectionListeners.delete(listener) }, getSelectedBranchId, () => '')
}

export function getSelectedBranchId() {
    if (typeof window === 'undefined') return ''
    return readOrganizationStorageItem(selectedBranchKey) ?? ''
}

export function setSelectedBranchId(id: string) {
    writeOrganizationStorageItem(selectedBranchKey, id)
    selectionListeners.forEach((listener) => listener())
}
