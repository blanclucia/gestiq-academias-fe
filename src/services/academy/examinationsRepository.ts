import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/AuthContext'
import { createCommissionExamApi, fetchCommissionExams, updateCommissionExamApi, type ApiExam } from '@/services/organization/examsApi'
import type { CommissionExam } from './academyTypes'

// A commission exam as the screens use it: the backend owns the exam, its students and the fee
// installments (real charges in Cobros), created and repriced in the same transaction.
export type CommissionExamRecord = CommissionExam & { studentIds: string[] }

const statusFromApi: Record<ApiExam['status'], CommissionExam['status']> = { draft: 'Borrador', open: 'Abierto', closed: 'Cerrado' }

function fromApiExam(exam: ApiExam): CommissionExamRecord {
    return {
        id: exam.id, commissionId: exam.commissionId, title: exam.title, examDate: exam.examDate, firstPaymentDueDate: exam.firstPaymentDueDate,
        feeAmount: exam.feeAmount, installmentCount: exam.installmentCount, status: statusFromApi[exam.status], createdAt: '', studentIds: exam.studentIds,
    }
}

export function useCommissionExams(courseId: string | undefined, commissionId: string | undefined) {
    const { session } = useAuth()
    const organizationSlug = session?.organization.slug
    const query = useQuery({
        queryKey: ['commission-exams', organizationSlug, courseId, commissionId],
        queryFn: ({ signal }) => fetchCommissionExams(organizationSlug!, courseId!, commissionId!, signal),
        enabled: Boolean(organizationSlug && courseId && commissionId),
    })
    return { exams: (query.data ?? []).map(fromApiExam), isLoading: query.isLoading, isError: query.isError }
}

type ExamTarget = { courseId: string; commissionId: string }

export function useCreateCommissionExam() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async ({ courseId, commissionId, input }: ExamTarget & { input: { title: string; examDate: string; firstPaymentDueDate: string; feeAmount: number; installmentCount: number; studentIds: string[] } }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            return fromApiExam(await createCommissionExamApi(organizationSlug, courseId, commissionId, input))
        },
        onSuccess: (_exam, { courseId, commissionId }) => {
            queryClient.invalidateQueries({ queryKey: ['commission-exams', organizationSlug, courseId, commissionId] })
            queryClient.invalidateQueries({ queryKey: ['charges', organizationSlug] })
        },
    })
}

export function useUpdateCommissionExam() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const organizationSlug = session?.organization.slug
    return useMutation({
        mutationFn: async ({ courseId, commissionId, examId, changes }: ExamTarget & { examId: string; changes: { title?: string; examDate?: string; firstPaymentDueDate?: string; feeAmount?: number; studentIds?: string[] } }) => {
            if (!organizationSlug) throw new Error('No hay organización activa.')
            return fromApiExam(await updateCommissionExamApi(organizationSlug, courseId, commissionId, examId, changes))
        },
        onSuccess: (_exam, { courseId, commissionId }) => {
            queryClient.invalidateQueries({ queryKey: ['commission-exams', organizationSlug, courseId, commissionId] })
            queryClient.invalidateQueries({ queryKey: ['charges', organizationSlug] })
        },
    })
}
