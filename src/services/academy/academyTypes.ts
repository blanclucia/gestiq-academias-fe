import type { Teacher } from '@/data/teachers'
import type { Payment, Student } from '@/types/domain'

export type PaymentChannel = 'Mercado Pago' | 'Transferencia' | 'Efectivo'
export type PublicRegistration = { id: string; offerSlug: string; openingId: string; commissionId: string; firstName: string; lastName: string; fullName: string; document: string; email: string; phone: string; birthDate: string; address?: string; tutorName?: string; tutorEmail?: string; tutorPhone?: string; priorStudies?: string; academicLevel?: string; adminNotes?: string; createdAt?: string; paidAt?: string; confirmed?: boolean; paid: boolean; paymentMethod?: PaymentChannel; transferReported?: boolean }
export type EnrollmentOpening = { id: string; slug: string; courseId: string; commissionId?: string; commissionIds?: string[]; startDate: string; endDate: string; status: 'Abierta' | 'Programada' | 'Cerrada'; amount: number }
export type AcademicCommission = { id: string; name: string; teacher: string; teachers: string[]; schedule: string; studentsCount: number; capacity: number; amount: number; startDate: string; endDate: string; dueDay: number; status: 'Activa' | 'Programada' | 'Cerrada' }
export type AcademicCycle = { id: string; name: string; startDate: string; endDate: string; status: 'Borrador' | 'Activo' | 'Cerrado' }
export type AcademicCourse = { id: string; cycleId: string; name: string; duration?: string; description?: string; studentsCount: number; status: 'Activo' | 'Borrador' | 'Cerrado'; commissions: AcademicCommission[] }
export type PrivateLesson = { id: string; studentId: string; teacher: string; purpose: string; plan: string; startDate: string; endDate: string; costPerClass: number; days: string[]; fromTime: string; toTime: string; status: 'Activa' | 'Pausada' | 'Finalizada' }
export type AttendanceRecord = { id: string; commissionId: string; studentId: string; date: string; status: 'Presente' | 'Tarde' | 'Ausente' }
export type ManualCharge = { id: string; student: string; category: string; detail: string; amount: number; method: Payment['method']; date: string; dueDate: string; status: Payment['status']; notes?: string; examId?: string; examEnrollmentId?: string; installmentNumber?: number }
export type CommissionExam = { id: string; commissionId: string; title: string; examDate?: string; firstPaymentDueDate: string; feeAmount: number; installmentCount: number; status: 'Borrador' | 'Abierto' | 'Cerrado'; createdAt: string }
export type ExamParticipationStatus = 'Inscripto' | 'Retirado'
export type ExamResultStatus = 'Pendiente' | 'Ausente' | 'Aprobado' | 'No aprobado'
export type LegacyExamEnrollmentStatus = ExamParticipationStatus | 'Habilitado' | 'No habilitado' | 'Ausente' | 'Aprobado' | 'No aprobado'
export type ExamEnrollment = { id: string; examId: string; commissionId: string; studentId: string; participationStatus: ExamParticipationStatus; resultStatus?: ExamResultStatus; enrolledAt: string }
export type PaymentUpdate = Partial<Pick<Payment, 'status' | 'method' | 'date' | 'dueDate' | 'amount'>> & { lastReminderAt?: string; deleted?: boolean }
export type CommissionStudentStatus = 'Activo' | 'Pausado' | 'Finalizado' | 'Baja'
export type CommissionAssignment = { studentId: string; commissionId?: string; courseName: string; commissionName: string; amount?: number; status: CommissionStudentStatus; enrolledAt: string }
export type AcademyState = { cycles: AcademicCycle[]; activeCycleId: string; courses: AcademicCourse[]; deletedCourseIds: string[]; staff: Teacher[]; deletedStaffIds: string[]; students: Student[]; deletedStudentIds: string[]; registrations: PublicRegistration[]; openings: EnrollmentOpening[]; deletedOpeningIds: string[]; assignments: CommissionAssignment[]; privateLessons: PrivateLesson[]; paymentUpdates: Record<string, PaymentUpdate>; attendanceRecords: AttendanceRecord[]; manualCharges: ManualCharge[]; commissionExams: CommissionExam[]; examEnrollments: ExamEnrollment[] }
