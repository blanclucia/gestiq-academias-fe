import { splitInstallments } from '@/domain/billing/billingRules'
import { addMonthsToDate, getLocalDateString } from '@/domain/shared/dateRules'
import { listStudents } from './studentsRepository'
import { readAcademyState, updateAcademyState } from './academyState'
import type { CommissionExam, ExamEnrollment, ExamResultStatus, LegacyExamEnrollmentStatus, ManualCharge } from './academyTypes'

function normalizeExamEnrollment(enrollment: ExamEnrollment | (Omit<ExamEnrollment, 'participationStatus' | 'resultStatus'> & { status: LegacyExamEnrollmentStatus })): ExamEnrollment {
    if ('participationStatus' in enrollment) return enrollment
    const resultStatuses: Partial<Record<LegacyExamEnrollmentStatus, ExamResultStatus>> = { Ausente: 'Ausente', Aprobado: 'Aprobado', 'No aprobado': 'No aprobado' }
    return { id: enrollment.id, examId: enrollment.examId, commissionId: enrollment.commissionId, studentId: enrollment.studentId, enrolledAt: enrollment.enrolledAt, participationStatus: 'Inscripto', resultStatus: resultStatuses[enrollment.status] }
}

export function listCommissionExams(commissionId: string) {
    const state = readAcademyState()
    return state.commissionExams.filter((exam) => exam.commissionId === commissionId).map((exam) => ({ ...exam, enrollments: state.examEnrollments.filter((enrollment) => enrollment.examId === exam.id).map(normalizeExamEnrollment) }))
}

export function createCommissionExam(input: Omit<CommissionExam, 'id' | 'createdAt' | 'status'>, studentIds: string[]) {
    const timestamp = Date.now()
    const exam: CommissionExam = { ...input, id: `EXAM-${timestamp}`, status: 'Abierto', createdAt: getLocalDateString() }
    const enrollments = studentIds.map((studentId, index): ExamEnrollment => ({ id: `EXAM-ENR-${timestamp}-${index}`, examId: exam.id, commissionId: exam.commissionId, studentId, participationStatus: 'Inscripto', resultStatus: 'Pendiente', enrolledAt: getLocalDateString() }))
    const installments = splitInstallments(exam.feeAmount, exam.installmentCount)
    const studentNames = new Map(listStudents().map((student) => [student.id, student.fullName]))
    const charges = enrollments.flatMap((enrollment) => installments.map((amount, installmentIndex): ManualCharge => ({
        id: `PAY-EXAM-${timestamp}-${installmentIndex}-${enrollment.studentId}`,
        student: studentNames.get(enrollment.studentId) ?? enrollment.studentId,
        category: 'Examen',
        detail: `${exam.title} · Cuota ${installmentIndex + 1}/${exam.installmentCount}`,
        amount,
        method: 'Transferencia',
        date: '-',
        dueDate: addMonthsToDate(exam.firstPaymentDueDate, installmentIndex),
        status: 'Pendiente',
        examId: exam.id,
        examEnrollmentId: enrollment.id,
        installmentNumber: installmentIndex + 1,
    })))
    updateAcademyState((current) => ({ ...current, commissionExams: [...current.commissionExams, exam], examEnrollments: [...current.examEnrollments, ...enrollments], manualCharges: [...current.manualCharges, ...charges] }))
    return exam
}

export function updateCommissionExam(id: string, changes: Partial<Pick<CommissionExam, 'title' | 'examDate' | 'firstPaymentDueDate' | 'feeAmount'>>) {
    updateAcademyState((current) => {
        const exam = current.commissionExams.find((item) => item.id === id)
        if (!exam) return current
        const nextExam = { ...exam, ...changes }
        const installments = splitInstallments(nextExam.feeAmount, nextExam.installmentCount)
        const manualCharges = current.manualCharges.map((charge) => {
            if (charge.examId !== id || charge.status === 'Pagado' || !charge.installmentNumber) return charge
            const installmentIndex = charge.installmentNumber - 1
            return { ...charge, amount: installments[installmentIndex], dueDate: addMonthsToDate(nextExam.firstPaymentDueDate, installmentIndex) }
        })
        return { ...current, commissionExams: current.commissionExams.map((item) => item.id === id ? nextExam : item), manualCharges }
    })
}
