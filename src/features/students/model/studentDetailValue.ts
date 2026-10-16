import type { Student } from '@/types/domain'
import type { StudentDetailValue } from './studentValidation'

// The saved student as the detail's form value; comparing it with the draft tells if there are changes.
export function toStudentDetailValue(student: Student): StudentDetailValue {
    return {
        firstName: student.firstName, lastName: student.lastName, document: student.document, email: student.email, phone: student.phone,
        birthDate: student.birthDate ?? '', status: student.status, notes: student.notes ?? '',
        tutorName: student.tutorName ?? '', tutorEmail: student.tutorEmail ?? '', tutorPhone: student.tutorPhone ?? '',
    }
}
