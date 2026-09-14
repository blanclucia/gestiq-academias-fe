// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { assignStudentsToCommission, getCommissionStudentStatus, listStudentCommissionHistory, updateCommissionStudentStatus } from './assignmentsRepository'

describe('assignments repository', () => {
    beforeEach(() => window.localStorage.clear())

    it('assigns only once and tracks status changes', () => {
        assignStudentsToCommission(['ST-1001'], 'Inglés General', 'Grupo A', 48_000, 'COM-101')
        assignStudentsToCommission(['ST-1001'], 'Inglés General', 'Grupo A', 48_000, 'COM-101')
        expect(listStudentCommissionHistory('ST-1001').filter((entry) => entry.commissionId === 'COM-101')).toHaveLength(1)
        updateCommissionStudentStatus('ST-1001', 'COM-101', 'Inglés General', 'Grupo A', 'Pausado')
        expect(getCommissionStudentStatus('ST-1001', 'COM-101', 'Inglés General', 'Grupo A')).toBe('Pausado')
    })
})
