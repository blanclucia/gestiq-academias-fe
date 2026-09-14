import { readOrganizationStorageItem, writeOrganizationStorageItem } from '@/workspace/organizationScope'

export function readStoredValue<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback
    try {
        const saved = JSON.parse(readOrganizationStorageItem(key) ?? 'null')
        return saved ?? fallback
    } catch {
        return fallback
    }
}

export function writeStoredValue<T>(key: string, value: T) {
    if (typeof window === 'undefined') return
    writeOrganizationStorageItem(key, JSON.stringify(value))
}
