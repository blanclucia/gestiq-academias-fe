export function createRepositoryEvents(storageKey: string) {
    const listeners = new Set<() => void>()
    let revision = 0

    const emit = () => {
        revision += 1
        listeners.forEach((listener) => listener())
    }
    const subscribe = (listener: () => void) => {
        listeners.add(listener)
        return () => listeners.delete(listener)
    }
    if (typeof window !== 'undefined') {
        window.addEventListener('storage', (event) => {
            if (event.key === organizationStorageKey(storageKey)) emit()
        })
    }
    return { emit, subscribe, getRevision: () => revision }
}
import { organizationStorageKey } from '@/workspace/organizationScope'
