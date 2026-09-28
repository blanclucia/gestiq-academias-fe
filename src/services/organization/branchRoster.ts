import { readOrganizationStorageItem, writeOrganizationStorageItem } from '@/workspace/organizationScope'

// The backend Branch model has no concept of manager/staff/student rosters yet
// (that domain isn't implemented server-side). Until it exists, this stays local per branch id.
export type BranchRoster = {
    managerId: string
    managerIds: string[]
    staffIds: string[]
    studentIds: string[]
    studentsCount: number
}

const storageKey = 'gestiq-branch-roster-v1'
const emptyRoster: BranchRoster = { managerId: '', managerIds: [], staffIds: [], studentIds: [], studentsCount: 0 }

function readAll(): Record<string, BranchRoster> {
    try {
        return JSON.parse(readOrganizationStorageItem(storageKey) ?? 'null') ?? {}
    } catch {
        return {}
    }
}

export function getBranchRoster(branchId: string): BranchRoster {
    return { ...emptyRoster, ...readAll()[branchId] }
}

export function setBranchRoster(branchId: string, changes: Partial<BranchRoster>): BranchRoster {
    const all = readAll()
    const next = { ...emptyRoster, ...all[branchId], ...changes }
    writeOrganizationStorageItem(storageKey, JSON.stringify({ ...all, [branchId]: next }))
    return next
}
