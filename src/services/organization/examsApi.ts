import { z } from 'zod'
import { authClient } from '@/auth/api/authClient'

const apiExamSchema = z.object({
    id: z.string(),
    commissionId: z.string(),
    title: z.string(),
    examDate: z.string(),
    firstPaymentDueDate: z.string(),
    feeAmount: z.number(),
    installmentCount: z.number(),
    status: z.enum(['draft', 'open', 'closed']),
    studentIds: z.array(z.string()),
})
const apiExamListSchema = z.object({ items: z.array(apiExamSchema) })

export type ApiExam = z.infer<typeof apiExamSchema>
export type ApiExamCreate = { title: string; examDate: string; firstPaymentDueDate: string; feeAmount: number; installmentCount: number; studentIds: string[] }
export type ApiExamPatch = Partial<Pick<ApiExamCreate, 'title' | 'examDate' | 'firstPaymentDueDate' | 'feeAmount' | 'studentIds'>>
type Requester = (path: string, init?: RequestInit) => Promise<unknown>
const defaultRequest: Requester = (path, init) => authClient.authorizedRequest(path, init)

function examsPath(organizationSlug: string, courseId: string, commissionId: string, suffix = '') {
    return `/organizations/${organizationSlug}/courses/${courseId}/commissions/${commissionId}/exams${suffix}`
}

export async function fetchCommissionExams(organizationSlug: string, courseId: string, commissionId: string, signal?: AbortSignal, request: Requester = defaultRequest): Promise<ApiExam[]> {
    return apiExamListSchema.parse(await request(examsPath(organizationSlug, courseId, commissionId), { signal })).items
}

export async function createCommissionExamApi(organizationSlug: string, courseId: string, commissionId: string, input: ApiExamCreate, request: Requester = defaultRequest): Promise<ApiExam> {
    return apiExamSchema.parse(await request(examsPath(organizationSlug, courseId, commissionId), { method: 'POST', body: JSON.stringify(input) }))
}

export async function updateCommissionExamApi(organizationSlug: string, courseId: string, commissionId: string, examId: string, changes: ApiExamPatch, request: Requester = defaultRequest): Promise<ApiExam> {
    return apiExamSchema.parse(await request(examsPath(organizationSlug, courseId, commissionId, `/${examId}`), { method: 'PATCH', body: JSON.stringify(changes) }))
}
