export type CommunicationTemplate = {
    id: string
    name: string
    description: string
    subject: string
    message: string
    enabled: boolean
    channels: string[]
}

export const defaultCommunicationTemplates: CommunicationTemplate[] = [
    { id: 'payment-due', name: 'Aviso de vencimiento', description: 'Recordá el pago antes de la fecha límite.', subject: 'Tu cuota vence el {fecha_vencimiento}', message: 'Hola {nombre}, te recordamos que tu cuota de {periodo} vence el {fecha_vencimiento}. Podés abonarla desde este enlace: {enlace_pago}.', enabled: true, channels: ['Email'] },
    { id: 'payment-overdue', name: 'Pago vencido', description: 'Avisá cuando una cuota todavía no fue registrada.', subject: 'Tu cuota está pendiente de pago', message: 'Hola {nombre}, vemos que la cuota de {periodo} aún no fue registrada. Si ya realizaste el pago, desestimá este mensaje. Consultas: {email_sede}.', enabled: true, channels: ['Email', 'WhatsApp'] },
    { id: 'class-reminder', name: 'Recordatorio de clase', description: 'Confirmá la próxima clase y su horario.', subject: 'Recordatorio: clase de {curso}', message: 'Hola {nombre}, te esperamos en {sede} para tu clase de {curso} el {fecha} a las {hora}.', enabled: false, channels: ['Email'] },
]

function storageKey(branchId: string) {
    return `gestiq-branch-communication-templates-${branchId}`
}

export function listCommunicationTemplates(branchId: string) {
    if (typeof window === 'undefined') return defaultCommunicationTemplates
    try {
        return JSON.parse(readOrganizationStorageItem(storageKey(branchId)) ?? 'null') as CommunicationTemplate[] | null ?? defaultCommunicationTemplates
    } catch {
        return defaultCommunicationTemplates
    }
}

export function saveCommunicationTemplates(branchId: string, templates: CommunicationTemplate[]) {
    writeOrganizationStorageItem(storageKey(branchId), JSON.stringify(templates))
}
import { readOrganizationStorageItem, writeOrganizationStorageItem } from '@/workspace/organizationScope'
