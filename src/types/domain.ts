export type StudentStatus = 'Activo' | 'Pendiente' | 'Inactivo'
export type CourseStatus = 'Activo' | 'Borrador' | 'Cerrado'
export type CommissionStatus = 'Activa' | 'Cerrada' | 'Programada'
export type EnrollmentStatus = 'Confirmada' | 'Pendiente' | 'En revisión'
export type BillingDisplayStatus = 'Pagado' | 'Pendiente' | 'En verificación' | 'Rechazado' | 'Vencido' | 'Parcial' | 'Anulado'
/** Read model temporal para la UI; no representa el estado persistido de una única entidad backend. */
export type PaymentStatus = BillingDisplayStatus
export type ChargeLifecycleStatus = 'open' | 'void'
export type PaymentProcessingStatus = 'reported' | 'under_review' | 'confirmed' | 'rejected' | 'refunded'

export type ChargePaymentSnapshot = {
    lifecycleStatus: ChargeLifecycleStatus
    paymentStatus?: PaymentProcessingStatus
    adjustedAmount: number
    paidAmount: number
    dueDate: string
    paidAt?: string
}
export type PaymentMethod = 'Transferencia' | 'Tarjeta' | 'Efectivo'
export type TeacherRole = 'Docente' | 'Administrativo'
export type TeacherStatus = 'Activo' | 'Inactivo'
export type ClassModality = 'Grupo' | 'Particular'

export type CourseSummary = {
    name: string
    group: string
    modality?: ClassModality
}

export type Student = {
    id: string
    firstName: string
    lastName: string
    fullName: string
    email: string
    phone: string
    document: string
    birthDate?: string
    tutorName?: string
    tutorEmail?: string
    tutorPhone?: string
    notes?: string
    status: StudentStatus
    courses: CourseSummary[]
}

export type Teacher = {
    id: string
    firstName: string
    lastName: string
    fullName: string
    email: string
    phone: string
    birthDate?: string
    specialty: string
    role: TeacherRole
    status: TeacherStatus
}

export type Course = {
    id: string
    code: string
    name: string
    category: string
    schedule: string
    studentsCount: number
    status: CourseStatus
    teacherIds?: string[]
}

export type Commission = {
    id: string
    name: string
    code: string
    course: string
    teacher: string
    studentsCount: number
    capacity: number
    status: CommissionStatus
    schedule: string
    startDate: string
    endDate: string
}

export type Enrollment = {
    id: string
    student: string
    commission: string
    plan: string
    amount: number
    status: EnrollmentStatus
    registrationDate: string
    nextPayment: string
}

export type Payment = {
    id: string
    student: string
    concept: string
    method: PaymentMethod
    date: string
    dueDate: string
    amount: number
    status: PaymentStatus
    lastReminderAt?: string
}
