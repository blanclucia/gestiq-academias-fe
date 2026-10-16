// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CommissionAssignmentModal, type AssignmentCommission, type AssignmentStudent } from './CommissionAssignmentModal'

afterEach(cleanup)

const students: AssignmentStudent[] = [{ id: 's1', fullName: 'Lucía Blanc', status: 'Activo', courses: [] }]
const commissions: AssignmentCommission[] = [{ id: 'c1', courseId: 'k1', courseName: 'Inglés A1', commissionName: 'Grupo A', studentsCount: 0, capacity: 20, amount: 48000, schedule: 'Lun 19:00', status: 'Activa' }]

describe('CommissionAssignmentModal', () => {
    it('takes the students chosen when it opens, not the ones from when the page loaded', () => {
        const props = { students, commissions, onClose: vi.fn(), onConfirm: vi.fn() }
        const { rerender } = render(<CommissionAssignmentModal {...props} open={false} selectedStudentIds={[]} />)
        // "Asignar a comisión" on a row: the student is chosen and the modal opens.
        rerender(<CommissionAssignmentModal {...props} open selectedStudentIds={['s1']} />)
        expect(screen.getByRole('button', { name: 'Asignar 1 alumno' })).toBeInTheDocument()
    })
})
