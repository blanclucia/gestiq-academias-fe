import { z } from 'zod'
import { authClient } from '@/auth/api/authClient'

const apiPrivateLessonSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    studentId: z.string(),
    teacherId: z.string(),
    purpose: z.string(),
    plan: z.enum(['single', 'monthly', 'pack4', 'pack8', 'pack12']),
    costPerClass: z.number(),
    startDate: z.string(),
    endDate: z.string(),
    days: z.array(z.string()),
    fromTime: z.string(),
    toTime: z.string(),
    status: z.enum(['active', 'finished']),
})
const apiPrivateLessonListSchema = z.object({ items: z.array(apiPrivateLessonSchema) })

export type ApiPrivateLesson = z.infer<typeof apiPrivateLessonSchema>
export type ApiPrivateLessonCreate = {
    studentId: string
    teacherId: string
    purpose: string
    plan: 'single' | 'monthly' | 'pack4' | 'pack8' | 'pack12'
    costPerClass: number
    startDate: string
    endDate: string
    days: string[]
    fromTime: string
    toTime: string
    status?: 'active' | 'finished'
}
export type ApiPrivateLessonPatch = Partial<Omit<ApiPrivateLessonCreate, 'studentId' | 'teacherId'>>
export type ApiPrivateLessonFilter = { studentId?: string; teacherId?: string; status?: string }
type Requester = (path: string, init?: RequestInit) => Promise<unknown>
const defaultRequest: Requester = (path, init) => authClient.authorizedRequest(path, init)

function privateLessonsPath(organizationSlug: string, suffix = '') {
    return `/organizations/${organizationSlug}/private-lessons${suffix}`
}

export async function fetchPrivateLessons(organizationSlug: string, filter: ApiPrivateLessonFilter = {}, signal?: AbortSignal, request: Requester = defaultRequest): Promise<ApiPrivateLesson[]> {
    const params = new URLSearchParams()
    if (filter.studentId) params.set('studentId', filter.studentId)
    if (filter.teacherId) params.set('teacherId', filter.teacherId)
    if (filter.status) params.set('status', filter.status)
    const query = params.toString()
    const result = apiPrivateLessonListSchema.parse(await request(privateLessonsPath(organizationSlug, query ? `?${query}` : ''), { signal }))
    return result.items
}

export async function createPrivateLessonApi(organizationSlug: string, input: ApiPrivateLessonCreate, request: Requester = defaultRequest): Promise<ApiPrivateLesson> {
    return apiPrivateLessonSchema.parse(await request(privateLessonsPath(organizationSlug), { method: 'POST', body: JSON.stringify(input) }))
}

export async function updatePrivateLessonApi(organizationSlug: string, lessonId: string, patch: ApiPrivateLessonPatch, request: Requester = defaultRequest): Promise<ApiPrivateLesson> {
    return apiPrivateLessonSchema.parse(await request(privateLessonsPath(organizationSlug, `/${lessonId}`), { method: 'PATCH', body: JSON.stringify(patch) }))
}
