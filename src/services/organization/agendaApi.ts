import { z } from 'zod'
import { authClient } from '@/auth/api/authClient'

const apiAgendaEventSchema = z.object({
    id: z.string(),
    branchId: z.string().nullable(),
    seriesId: z.string().nullable(),
    type: z.enum(['academico', 'reunion', 'recordatorio', 'feriado', 'otro']),
    title: z.string(),
    description: z.string(),
    location: z.string(),
    date: z.string(),
    endDate: z.string(),
    allDay: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
})
const apiAgendaListSchema = z.object({
    items: z.array(apiAgendaEventSchema),
    holidays: z.array(z.object({ date: z.string(), title: z.string() })),
    exams: z.array(z.object({ examId: z.string(), date: z.string(), title: z.string(), courseName: z.string(), commissionId: z.string(), commissionName: z.string(), branchId: z.string() })).default([]),
})

export type ApiAgendaEvent = z.infer<typeof apiAgendaEventSchema>
export type ApiAgendaList = z.infer<typeof apiAgendaListSchema>
export type ApiAgendaEventInput = {
    branchId: string | null
    type: ApiAgendaEvent['type']
    title: string
    description: string
    location: string
    date: string
    endDate: string
    allDay: boolean
    startTime: string
    endTime: string
}
export type ApiAgendaRecurrence = { weekdays: number[]; repeatUntil: string }
type Requester = (path: string, init?: RequestInit) => Promise<unknown>
const defaultRequest: Requester = (path, init) => authClient.authorizedRequest(path, init)

function agendaPath(organizationSlug: string, suffix = '') {
    return `/organizations/${organizationSlug}/agenda-events${suffix}`
}

export async function fetchAgendaEvents(organizationSlug: string, range: { from: string; to: string; branchId?: string }, signal?: AbortSignal, request: Requester = defaultRequest): Promise<ApiAgendaList> {
    const query = new URLSearchParams({ from: range.from, to: range.to, ...(range.branchId ? { branchId: range.branchId } : {}) })
    return apiAgendaListSchema.parse(await request(agendaPath(organizationSlug, `?${query}`), { signal }))
}

export async function createAgendaEventApi(organizationSlug: string, input: ApiAgendaEventInput & { recurrence?: ApiAgendaRecurrence }, request: Requester = defaultRequest): Promise<ApiAgendaList> {
    return apiAgendaListSchema.parse(await request(agendaPath(organizationSlug), { method: 'POST', body: JSON.stringify(input) }))
}

export async function updateAgendaEventApi(organizationSlug: string, id: string, changes: Partial<ApiAgendaEventInput>, request: Requester = defaultRequest): Promise<ApiAgendaEvent> {
    return apiAgendaEventSchema.parse(await request(agendaPath(organizationSlug, `/${id}`), { method: 'PATCH', body: JSON.stringify(changes) }))
}

export async function deleteAgendaEventApi(organizationSlug: string, id: string, request: Requester = defaultRequest): Promise<void> {
    await request(agendaPath(organizationSlug, `/${id}`), { method: 'DELETE' })
}
