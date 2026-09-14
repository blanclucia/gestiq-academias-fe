import { getLocalDateString } from '@/domain/shared/dateRules'
import { readAcademyState, updateAcademyState } from './academyState'
import type { CommissionAssignment, CommissionStudentStatus } from './academyTypes'
import { listCourses } from './coursesRepository'
import { listStudents } from './studentsRepository'

export type StudentCommissionHistory = { id: string; courseId: string; courseName: string; commissionName: string; commissionId: string; startDate: string; endDate: string; status: CommissionStudentStatus; enrolledAt: string }

export function assignStudentsToCommission(studentIds: string[], courseName: string, commissionName: string, amount: number, commissionId?: string, status: CommissionStudentStatus = 'Activo') {
    updateAcademyState((current) => {
        const known = new Set(current.assignments.map((item) => `${item.studentId}|${item.courseName}|${item.commissionName}`))
        const additions = studentIds.filter((studentId) => !known.has(`${studentId}|${courseName}|${commissionName}`)).map((studentId) => ({ studentId, commissionId, courseName, commissionName, amount, status, enrolledAt: getLocalDateString() }))
        return { ...current, assignments: [...current.assignments, ...additions] }
    })
}

export function getCommissionStudentStatus(studentId: string, commissionId: string, courseName: string, commissionName: string): CommissionStudentStatus {
    return readAcademyState().assignments.find((item) => item.studentId === studentId && (item.commissionId === commissionId || (!item.commissionId && item.courseName === courseName && item.commissionName === commissionName)))?.status ?? 'Activo'
}

export function updateCommissionStudentStatus(studentId: string, commissionId: string, courseName: string, commissionName: string, status: CommissionStudentStatus) {
    updateAcademyState((current) => {
        const matches = (assignment: CommissionAssignment) => assignment.studentId === studentId && (assignment.commissionId === commissionId || (!assignment.commissionId && assignment.courseName === courseName && assignment.commissionName === commissionName))
        return { ...current, assignments: current.assignments.some(matches) ? current.assignments.map((assignment) => matches(assignment) ? { ...assignment, commissionId, status } : assignment) : [...current.assignments, { studentId, commissionId, courseName, commissionName, status, enrolledAt: getLocalDateString() }] }
    })
}

export function listStudentCommissionHistory(studentId: string): StudentCommissionHistory[] {
    const state = readAcademyState()
    const student = listStudents().find((item) => item.id === studentId)
    const assignments = state.assignments.filter((assignment) => assignment.studentId === studentId)
    const entries = new Map<string, StudentCommissionHistory>()
    student?.courses.forEach((summary) => {
        const course = listCourses().find((item) => item.name === summary.name)
        const commission = course?.commissions.find((item) => item.name === summary.group)
        if (!course || !commission) return
        const assignment = assignments.find((item) => item.commissionId === commission.id || (!item.commissionId && item.courseName === course.name && item.commissionName === commission.name))
        entries.set(`${course.name}|${commission.name}`, { id: commission.id, courseId: course.id, courseName: course.name, commissionName: commission.name, commissionId: commission.id, startDate: commission.startDate, endDate: commission.endDate, status: assignment?.status ?? 'Activo', enrolledAt: assignment?.enrolledAt ?? commission.startDate })
    })
    assignments.forEach((assignment) => {
        const course = listCourses().find((item) => item.name === assignment.courseName || item.commissions.some((commission) => commission.id === assignment.commissionId))
        const commission = course?.commissions.find((item) => item.id === assignment.commissionId || item.name === assignment.commissionName)
        const key = `${assignment.courseName}|${assignment.commissionName}`
        entries.set(key, { id: commission?.id ?? assignment.commissionId ?? key, courseId: course?.id ?? '', courseName: assignment.courseName, commissionName: assignment.commissionName, commissionId: commission?.id ?? assignment.commissionId ?? key, startDate: commission?.startDate ?? assignment.enrolledAt, endDate: commission?.endDate ?? assignment.enrolledAt, status: assignment.status, enrolledAt: assignment.enrolledAt })
    })
    return [...entries.values()].sort((a, b) => b.startDate.localeCompare(a.startDate))
}
