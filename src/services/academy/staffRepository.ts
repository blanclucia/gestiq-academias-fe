import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/AuthContext'
import type { Teacher } from '@/data/teachers'
import { createMemberApi } from '@/services/organization/membersApi'
import { createStaffApi, deleteStaffApi, fetchStaff, updateStaffApi, type ApiStaff, type ApiStaffInput, type ApiStaffPatch } from '@/services/organization/staffApi'
import { staffRoleFromApi, staffRoleToApi, staffStatusFromApi, staffStatusToApi } from '@/services/organization/staffMapping'
import { readAcademyState, updateAcademyState } from './academyState'

function fromApiStaff(member: ApiStaff): Teacher {
    return {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        fullName: member.fullName,
        email: member.email,
        phone: member.phone,
        specialty: member.specialty,
        dni: member.dni,
        role: staffRoleFromApi(member.role),
        status: staffStatusFromApi(member.status),
        userId: member.userId,
    }
}

function sameMirror(current: Teacher[], next: Teacher[]): boolean {
    if (current.length !== next.length) return false
    return current.every((member, index) => {
        const other = next[index]
        return other !== undefined && member.id === other.id && member.status === other.status && member.fullName === other.fullName
            && member.email === other.email && member.phone === other.phone && member.specialty === other.specialty
            && member.role === other.role && member.userId === other.userId
    })
}

function upsertMirror(current: Teacher[], member: Teacher): Teacher[] {
    return current.some((item) => item.id === member.id) ? current.map((item) => item.id === member.id ? member : item) : [...current, member]
}

// listStaff() stays synchronous because CommissionForm, AdminDashboardPage, StaffSelect and
// agendaRepository read it outside React, without awaiting anything. It reads a local mirror of
// the real backend list (kept warm by useStaff()/<StaffSync>) — real backend is now the source of
// truth, this is just a cache. useCreateStaffMember()/useUpdateStaffMember() also write into it
// synchronously (not just via invalidation) because BranchesSettingsPage reads listStaff() right
// after those mutations resolve, in the same callback, to chain a branch/administrator assignment.
export function listStaff(): Teacher[] {
    return readAcademyState().staff
}

export function useStaff(options: { enabled?: boolean } = {}) {
    const { session } = useAuth()
    const organizationSlug = session?.organization.slug
    const query = useQuery({
        queryKey: ['staff', organizationSlug],
        queryFn: ({ signal }) => fetchStaff(organizationSlug!, signal),
        enabled: Boolean(organizationSlug) && (options.enabled ?? true),
    })
    useEffect(() => {
        if (!query.data) return
        const mapped = query.data.map(fromApiStaff)
        if (!sameMirror(readAcademyState().staff, mapped)) {
            updateAcademyState((current) => ({ ...current, staff: mapped }))
        }
    }, [query.data])
    return { staff: listStaff(), isLoading: query.isLoading, isError: query.isError, error: query.error }
}

export function rolesFor(role: Teacher['role'], isAdministrator: boolean): string[] {
    return [...(role === 'Docente' ? ['teacher'] : []), ...(isAdministrator ? ['admin'] : [])]
}

// Creating staff also creates their real backend user (organizations/{slug}/members) so they can
// later be granted the admin role and assigned as a branch administrator. The form always resolves
// to a non-empty set of platform roles, so a userId is always available before the staff profile
// itself is created — no follow-up PATCH is needed to attach it.
export function useCreateStaffMember() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async (input: Omit<Teacher, 'id' | 'userId'> & { dni: string; isAdministrator: boolean }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            const { isAdministrator, dni, ...teacherFields } = input
            const member = await createMemberApi(organizationSlug, { dni, name: teacherFields.fullName, email: teacherFields.email, roles: rolesFor(teacherFields.role, isAdministrator) })
            const payload: ApiStaffInput = {
                firstName: teacherFields.firstName, lastName: teacherFields.lastName, email: teacherFields.email, phone: teacherFields.phone,
                specialty: teacherFields.specialty, dni, role: staffRoleToApi(teacherFields.role), status: staffStatusToApi(teacherFields.status), userId: member.userId,
            }
            const created = await createStaffApi(organizationSlug, payload)
            return fromApiStaff(created)
        },
        onSuccess: (created) => {
            updateAcademyState((current) => ({ ...current, staff: upsertMirror(current.staff, created) }))
            void queryClient.invalidateQueries({ queryKey: ['staff', organizationSlug] })
        },
    })
}

// If an existing staff member has no linked backend user yet and a DNI is now available,
// this backfills their account so they become eligible for the admin role.
export function useUpdateStaffMember() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async ({ id, changes, isAdministrator }: { id: string; changes: Partial<Omit<Teacher, 'id'>>; isAdministrator: boolean }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            const existing = listStaff().find((member) => member.id === id)
            if (!existing) throw new Error('Integrante no encontrado.')
            const merged = { ...existing, ...changes }
            let userId = existing.userId
            if (!userId && merged.dni) {
                const member = await createMemberApi(organizationSlug, { dni: merged.dni, name: merged.fullName, email: merged.email, roles: rolesFor(merged.role, isAdministrator) })
                userId = member.userId
            }
            const patch: ApiStaffPatch = {}
            if (changes.firstName !== undefined) patch.firstName = changes.firstName
            if (changes.lastName !== undefined) patch.lastName = changes.lastName
            if (changes.email !== undefined) patch.email = changes.email
            if (changes.phone !== undefined) patch.phone = changes.phone
            if (changes.specialty !== undefined) patch.specialty = changes.specialty
            if (changes.dni !== undefined) patch.dni = changes.dni
            if (changes.role !== undefined) patch.role = staffRoleToApi(changes.role)
            if (changes.status !== undefined) patch.status = staffStatusToApi(changes.status)
            if (userId !== existing.userId) patch.userId = userId
            const updated = await updateStaffApi(organizationSlug, id, patch)
            return fromApiStaff(updated)
        },
        onSuccess: (updated) => {
            updateAcademyState((current) => ({ ...current, staff: upsertMirror(current.staff, updated) }))
            void queryClient.invalidateQueries({ queryKey: ['staff', organizationSlug] })
        },
    })
}

export function useDeleteStaffMember() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async (id: string) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            await deleteStaffApi(organizationSlug, id)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff', organizationSlug] }),
    })
}
