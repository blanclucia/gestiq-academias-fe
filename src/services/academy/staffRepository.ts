import { initialTeachers, type Teacher } from '@/data/teachers'
import { readAcademyState, updateAcademyState } from './academyState'

export function listStaff() {
    const state = readAcademyState()
    const storedIds = new Set(state.staff.map((member) => member.id))
    return [...initialTeachers.filter((member) => !storedIds.has(member.id) && !state.deletedStaffIds.includes(member.id)), ...state.staff]
}

export function createStaff(member: Omit<Teacher, 'id'>) {
    const next = { ...member, id: `T-${Date.now()}` }
    updateAcademyState((current) => ({ ...current, staff: [...current.staff, next] }))
    return next
}

export function updateStaff(id: string, changes: Partial<Omit<Teacher, 'id'>>) {
    const existing = listStaff().find((member) => member.id === id)
    if (!existing) return
    updateAcademyState((current) => {
        const next = { ...existing, ...changes }
        return { ...current, staff: current.staff.some((member) => member.id === id) ? current.staff.map((member) => member.id === id ? next : member) : [...current.staff, next] }
    })
}

export function removeStaff(id: string) {
    updateAcademyState((current) => ({ ...current, staff: current.staff.filter((member) => member.id !== id), deletedStaffIds: current.deletedStaffIds.includes(id) ? current.deletedStaffIds : [...current.deletedStaffIds, id] }))
}
