import { useSyncExternalStore } from 'react'
import { readOrganizationStorageItem, writeOrganizationStorageItem } from '@/workspace/organizationScope'

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

const storageKey = 'gestiq-academy-branches-v1'
const selectedBranchKey = 'gestiq-selected-branch-v1'
const listeners = new Set<() => void>()
let revision = 0

const initialBranches: AcademyBranch[] = [{
    id: 'BR-1001',
    name: 'Sede San José',
    address: 'Av. San Martín 1240, Córdoba',
    email: 'sanjose@academiapuentes.com',
    phone: '+54 351 555-0198',
    managerId: 'T-101',
    managerIds: ['T-101'],
    staffIds: ['T-101', 'T-102'],
    studentIds: ['ST-1001'],
    weekDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    openingTime: '08:00',
    closingTime: '21:00',
    studentsCount: 6,
    status: 'Activa',
}]

function read(): AcademyBranch[] {
    if (typeof window === 'undefined') return initialBranches
    try {
        const branches = JSON.parse(readOrganizationStorageItem(storageKey) ?? 'null') as AcademyBranch[] | null
        return (branches ?? initialBranches).map((branch) => ({ ...branch, managerIds: branch.managerIds ?? (branch.managerId ? [branch.managerId] : []), studentIds: branch.studentIds ?? (branch.id === 'BR-1001' ? ['ST-1001'] : []) }))
    } catch {
        return initialBranches
    }
}

function write(branches: AcademyBranch[]) {
    writeOrganizationStorageItem(storageKey, JSON.stringify(branches))
    revision += 1
    listeners.forEach((listener) => listener())
}

export function useBranchRepositoryVersion() {
    return useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener) }, () => revision, () => 0)
}

export function useSelectedBranchId() {
    return useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener) }, getSelectedBranchId, () => initialBranches[0]?.id ?? '')
}

export function listBranches() { return read() }

export function listAccessibleBranches(role: 'admin' | 'teacher' | 'student', isOwner: boolean, userId?: string) {
    const branches = read().filter((branch) => branch.status === 'Activa')
    const identityId = userId ?? (role === 'student' ? 'ST-1001' : 'T-101')
    if (role === 'admin') return isOwner ? branches : branches.filter((branch) => branch.managerIds.includes(identityId))
    if (role === 'teacher') return branches.filter((branch) => branch.staffIds.includes(identityId))
    return branches.filter((branch) => branch.studentIds.includes(identityId))
}

export function getSelectedBranchId() {
    if (typeof window === 'undefined') return initialBranches[0]?.id ?? ''
    return readOrganizationStorageItem(selectedBranchKey) ?? initialBranches[0]?.id ?? ''
}

export function setSelectedBranchId(id: string) {
    writeOrganizationStorageItem(selectedBranchKey, id)
    revision += 1
    listeners.forEach((listener) => listener())
}

export function createBranch(data: Omit<AcademyBranch, 'id' | 'studentsCount'>) {
    const branch: AcademyBranch = { ...data, id: `BR-${Date.now()}`, studentsCount: 0 }
    write([...read(), branch])
    return branch
}

export function updateBranch(id: string, changes: Partial<Omit<AcademyBranch, 'id'>>) {
    write(read().map((branch) => branch.id === id ? { ...branch, ...changes } : branch))
}
