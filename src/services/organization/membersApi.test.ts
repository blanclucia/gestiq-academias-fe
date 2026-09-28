import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/services/http/client'
import { administersBranches, createMemberApi, grantMemberRoleApi, isMemberConflict, revokeMemberRoleApi } from './membersApi'

const apiMember = { userId: 'u1', name: 'Ana Docente', email: 'ana@example.com', dni: '12345678', roles: ['teacher'], status: 'active' }

describe('members API client', () => {
    it('creates a member with the given payload', async () => {
        const request = vi.fn().mockResolvedValue(apiMember)
        const input = { dni: '12345678', name: 'Ana Docente', email: 'ana@example.com', roles: ['teacher'] }
        const created = await createMemberApi('academy-demo', input, request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/members', { method: 'POST', body: JSON.stringify(input) })
        expect(created).toEqual(apiMember)
    })
    it('grants a role with no body', async () => {
        const request = vi.fn().mockResolvedValue(undefined)
        await grantMemberRoleApi('academy-demo', 'u1', 'admin', request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/members/u1/roles/admin', { method: 'PUT' })
    })
    it('revokes a role with no body', async () => {
        const request = vi.fn().mockResolvedValue(undefined)
        await revokeMemberRoleApi('academy-demo', 'u1', 'admin', request)
        expect(request).toHaveBeenCalledWith('/organizations/academy-demo/members/u1/roles/admin', { method: 'DELETE' })
    })
    it('rejects a malformed response instead of returning bad data', async () => {
        const request = vi.fn().mockResolvedValue({ ...apiMember, roles: 'not-an-array' })
        await expect(createMemberApi('academy-demo', { dni: '', name: '', email: '', roles: [] }, request)).rejects.toThrow()
    })
    it('identifies a duplicate-member conflict', () => {
        expect(isMemberConflict(new ApiError(409, 'member_already_exists'))).toBe(true)
        expect(isMemberConflict(new ApiError(409, 'branch_code_conflict'))).toBe(false)
        expect(isMemberConflict(new Error('boom'))).toBe(false)
    })
    it('identifies the still-administers-branches conflict', () => {
        expect(administersBranches(new ApiError(409, 'member_administers_branches'))).toBe(true)
        expect(administersBranches(new ApiError(409, 'member_already_exists'))).toBe(false)
    })
})
