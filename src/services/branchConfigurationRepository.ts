export type BranchSettings = {
    name: string
    email: string
    address: string
    phone: string
    schedule: string
    timezone: string
}

export type BranchAutomation = {
    id: string
    label: string
    description: string
    enabled: boolean
}

export const defaultBranchSettings: BranchSettings = {
    name: 'Sede San José',
    email: 'sanjose@academiapuentes.com',
    address: 'Av. San Martín 1240, Córdoba',
    phone: '+54 351 555-0198',
    schedule: 'Lunes a viernes, de 08:00 a 21:00',
    timezone: 'America/Argentina/Cordoba',
}

export const defaultBranchAutomations: BranchAutomation[] = [
    { id: 'due-reminder', label: 'Avisar antes del vencimiento', description: 'Enviar el aviso de vencimiento 3 días antes.', enabled: true },
    { id: 'overdue-reminder', label: 'Avisar pagos vencidos', description: 'Enviar un aviso cuando una cuota queda impaga.', enabled: true },
    { id: 'class-reminder', label: 'Recordar las próximas clases', description: 'Enviar un recordatorio el día anterior.', enabled: false },
    { id: 'welcome-message', label: 'Dar la bienvenida a nuevos alumnos', description: 'Enviar una comunicación al confirmar una inscripción.', enabled: false },
]

function settingsKey(branchId: string) { return `gestiq-branch-settings-${branchId}` }
function automationKey(branchId: string) { return `gestiq-branch-automations-${branchId}` }

function read<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback
    try { return JSON.parse(readOrganizationStorageItem(key) ?? 'null') ?? fallback } catch { return fallback }
}

export function getBranchSettings(branchId: string, defaults: Partial<BranchSettings> = {}) {
    return read<BranchSettings>(settingsKey(branchId), { ...defaultBranchSettings, ...defaults })
}

export function saveBranchSettings(branchId: string, settings: BranchSettings) {
    writeOrganizationStorageItem(settingsKey(branchId), JSON.stringify(settings))
}

export function listBranchAutomations(branchId: string) {
    return read<BranchAutomation[]>(automationKey(branchId), defaultBranchAutomations)
}

export function saveBranchAutomations(branchId: string, automations: BranchAutomation[]) {
    writeOrganizationStorageItem(automationKey(branchId), JSON.stringify(automations))
}

export function copyBranchConfiguration(sourceBranchId: string, targetBranchId: string) {
    const templates = readOrganizationStorageItem(`gestiq-branch-communication-templates-${sourceBranchId}`)
    const automations = readOrganizationStorageItem(automationKey(sourceBranchId))
    if (templates) writeOrganizationStorageItem(`gestiq-branch-communication-templates-${targetBranchId}`, templates)
    if (automations) writeOrganizationStorageItem(automationKey(targetBranchId), automations)
}
import { readOrganizationStorageItem, writeOrganizationStorageItem } from '@/workspace/organizationScope'
