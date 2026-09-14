// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listAttendanceForStudent, listAttendanceRecords, recordAttendance } from './attendanceRepository'

describe('attendance repository', () => {
    beforeEach(() => { window.localStorage.clear(); vi.restoreAllMocks() })

    it('upserts one attendance record per student, commission and date', () => {
        vi.spyOn(Date, 'now').mockReturnValue(7_000)
        recordAttendance('COM-101', 'ST-1001', '2026-09-09', 'Presente')
        recordAttendance('COM-101', 'ST-1001', '2026-09-09', 'Tarde')
        expect(listAttendanceRecords('COM-101', '2026-09-09')).toEqual([{ id: 'ATT-7000-ST-1001', commissionId: 'COM-101', studentId: 'ST-1001', date: '2026-09-09', status: 'Tarde' }])
        expect(listAttendanceForStudent('ST-1001')).toHaveLength(1)
    })
})
