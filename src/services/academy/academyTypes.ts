import type { Teacher } from '@/data/teachers'
import type { Payment, Student } from '@/types/domain'

export type PaymentChannel = 'Mercado Pago' | 'Transferencia' | 'Efectivo'
export type EnrollmentOpening = { id: string; slug: string; courseId: string; commissionIds: string[]; startDate: string; endDate: string; status: 'Abierta' | 'Programada' | 'Cerrada'; amount: number; registrationsCount: number }
export type AcademicCommission = { id: string; name: string; teacher: string; teachers: string[]; schedule: string; studentsCount: number; capacity: number; amount: number; startDate: string; endDate: string; dueDay: number; status: 'Activa' | 'Programada' | 'Cerrada' }
export type AcademicCycle = { id: string; name: string; startDate: string; endDate: string; status: 'Borrador' | 'Activo' | 'Cerrado' }
export type AcademicCourse = { id: string; branchId: string; cycleId: string; name: string; description?: string; studentsCount: number; status: 'Activo' | 'Borrador' | 'Cerrado'; commissions: AcademicCommission[] }
export type PrivateLesson = { id: string; studentId: string; teacherId: string; purpose: string; plan: string; startDate: string; endDate: string; costPerClass: number; days: string[]; fromTime: string; toTime: string; status: 'Activa' | 'Pausada' | 'Finalizada' }
export type AttendanceRecord = { id: string; commissionId: string; studentId: string; date: string; status: 'Presente' | 'Tarde' | 'Ausente' }
export type ManualCharge = { id: string; student: string; category: string; detail: string; amount: number; method: Payment['method']; date: string; dueDate: string; status: Payment['status']; notes?: string; examId?: string; examEnrollmentId?: string; installmentNumber?: number }
export type CommissionExam = { id: string; commissionId: string; title: string; examDate?: string; firstPaymentDueDate: string; feeAmount: number; installmentCount: number; status: 'Borrador' | 'Abierto' | 'Cerrado'; createdAt: string }
export type ExamParticipationStatus = 'Inscripto' | 'Retirado'
export type ExamResultStatus = 'Pendiente' | 'Ausente' | 'Aprobado' | 'No aprobado'
export type LegacyExamEnrollmentStatus = ExamParticipationStatus | 'Habilitado' | 'No habilitado' | 'Ausente' | 'Aprobado' | 'No aprobado'
export type ExamEnrollment = { id: string; examId: string; commissionId: string; studentId: string; participationStatus: ExamParticipationStatus; resultStatus?: ExamResultStatus; enrolledAt: string }
export type PaymentUpdate = Partial<Pick<Payment, 'status' | 'method' | 'date' | 'dueDate' | 'amount'>> & { lastReminderAt?: string; deleted?: boolean }
export type CommissionStudentStatus = 'Activo' | 'Pausado' | 'Finalizado' | 'Baja'
// Mirror of a real backend charge (source=commission cuota or source=manual charge). `student` is
// resolved lazily from studentId at listPayments() time, same as the still-mock payment sources.
export type RealCharge = { id: string; studentId: string; commissionId?: string; source: 'commission' | 'manual'; concept: string; amount: number; dueDate: string; status: Payment['status']; method: Payment['method']; date: string; notes: string }
export type AcademyState = { cycles: AcademicCycle[]; activeCycleId: string; courses: AcademicCourse[]; deletedCourseIds: string[]; staff: Teacher[]; deletedStaffIds: string[]; students: Student[]; deletedStudentIds: string[]; openings: EnrollmentOpening[]; deletedOpeningIds: string[]; privateLessons: PrivateLesson[]; paymentUpdates: Record<string, PaymentUpdate>; attendanceRecords: AttendanceRecord[]; manualCharges: ManualCharge[]; commissionExams: CommissionExam[]; examEnrollments: ExamEnrollment[]; charges: RealCharge[] }
