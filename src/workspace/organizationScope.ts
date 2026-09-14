let activeOrganizationId = 'org-puentes'

export function setActiveOrganizationId(organizationId: string) {
    activeOrganizationId = organizationId
}

export function organizationStorageKey(key: string) {
    return `gestiq:${activeOrganizationId}:${key.replace(/^gestiq-/, '')}`
}

export function readOrganizationStorageItem(key: string) {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(organizationStorageKey(key)) ?? window.localStorage.getItem(key)
}

export function writeOrganizationStorageItem(key: string, value: string) {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(organizationStorageKey(key), value)
}
