import { initialStudents } from '@/data/students'
import { isMinor } from '@/domain/students/studentRules'
import { getPublicEnrollmentOffer } from './enrollmentsRepository'
import type { Student } from '@/types/domain'
import { readAcademyState, updateAcademyState } from './academyState'

export function listStudents(): Student[] {
    const state = readAcademyState()
    const paidStudents = state.registrations.filter((registration) => registration.paid || registration.confirmed).flatMap((registration) => {
        const offer = getPublicEnrollmentOffer(registration.offerSlug)
        const commission = offer?.commissions.find((item) => item.id === registration.commissionId) ?? offer?.commissions[0]
        return offer && commission ? [{
            id: `ST-${registration.id}`, firstName: registration.firstName, lastName: registration.lastName, fullName: registration.fullName,
            email: registration.email, phone: registration.phone, document: registration.document, birthDate: registration.birthDate,
            tutorName: isMinor(registration.birthDate) ? registration.tutorName : undefined,
            tutorEmail: isMinor(registration.birthDate) ? registration.tutorEmail : undefined,
            tutorPhone: isMinor(registration.birthDate) ? registration.tutorPhone : undefined,
            status: 'Activo' as const, notes: 'Alta originada en autoinscripción.',
            courses: [{ name: offer.courseName, group: commission.name, modality: 'Grupo' as const }],
        }] : []
    })
    const generatedStudents = [...initialStudents, ...paidStudents]
    const storedStudentIds = new Set(state.students.map((student) => student.id))
    return [...generatedStudents.filter((student) => !storedStudentIds.has(student.id) && !state.deletedStudentIds.includes(student.id)), ...state.students].map((student) => {
        const courses = new Map(student.courses.map((course) => [`${course.name}|${course.group}|${course.modality ?? 'Grupo'}`, course]))
        state.assignments.filter((assignment) => assignment.studentId === student.id).forEach((assignment) => courses.set(`${assignment.courseName}|${assignment.commissionName}|Grupo`, { name: assignment.courseName, group: assignment.commissionName, modality: 'Grupo' as const }))
        return { ...student, courses: Array.from(courses.values()) }
    })
}

export function createStudent(student: Omit<Student, 'id'>) {
    const next: Student = { ...student, id: `ST-${Date.now()}` }
    updateAcademyState((current) => ({ ...current, students: [...current.students, next], deletedStudentIds: current.deletedStudentIds.filter((id) => id !== next.id) }))
    return next
}

export function updateStudent(id: string, changes: Partial<Omit<Student, 'id'>>) {
    const currentStudent = listStudents().find((student) => student.id === id)
    if (!currentStudent) return
    updateAcademyState((current) => {
        const next = { ...currentStudent, ...changes }
        return { ...current, students: current.students.some((student) => student.id === id) ? current.students.map((student) => student.id === id ? next : student) : [...current.students, next] }
    })
}

export function removeStudent(id: string) {
    updateAcademyState((current) => ({ ...current, students: current.students.filter((student) => student.id !== id), deletedStudentIds: current.deletedStudentIds.includes(id) ? current.deletedStudentIds : [...current.deletedStudentIds, id] }))
}

export function listStudentsInCommission(courseName: string, commissionName: string, commissionId?: string) {
    const assignments = readAcademyState().assignments
    return listStudents().filter((student) => assignments.some((assignment) => assignment.studentId === student.id && (assignment.commissionId === commissionId || (!assignment.commissionId && assignment.courseName === courseName && assignment.commissionName === commissionName))) || student.courses.some((course) => course.name === courseName && course.group === commissionName))
}
