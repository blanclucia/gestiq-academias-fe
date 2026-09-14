import { readAcademyState, updateAcademyState } from './academyState'
import type { AttendanceRecord } from './academyTypes'

export function listAttendanceRecords(commissionId: string, date?: string) {
    return readAcademyState().attendanceRecords.filter((record) => record.commissionId === commissionId && (!date || record.date === date))
}

export function listAttendanceForStudent(studentId: string) {
    return readAcademyState().attendanceRecords.filter((record) => record.studentId === studentId)
}

export function recordAttendance(commissionId: string, studentId: string, date: string, status: AttendanceRecord['status']) {
    updateAcademyState((current) => {
        const existing = current.attendanceRecords.find((record) => record.commissionId === commissionId && record.studentId === studentId && record.date === date)
        const record = { id: existing?.id ?? `ATT-${Date.now()}-${studentId}`, commissionId, studentId, date, status }
        return { ...current, attendanceRecords: existing ? current.attendanceRecords.map((item) => item.id === existing.id ? record : item) : [...current.attendanceRecords, record] }
    })
}
