// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { QuickCreateTeacherModal } from './QuickCreateTeacherModal'

const createStaff = vi.fn()
const assignToBranch = vi.fn()
const invalidateRoster = vi.fn()

vi.mock('@/services/academyRepository', () => ({ useCreateStaffMember: () => ({ mutate: createStaff }) }))
vi.mock('@/services/branchRepository', () => ({ useSetBranchStaffScope: () => ({ mutate: assignToBranch }), useBranchRosterInvalidation: () => invalidateRoster }))
vi.mock('@/components/ui/ToastContext', () => ({ useToast: () => ({ showToast: vi.fn() }) }))

afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

const fillAndSubmit = () => {
    fireEvent.change(document.querySelector('[name=teacherFirstName]')!, { target: { value: 'Ana' } })
    fireEvent.change(document.querySelector('[name=teacherLastName]')!, { target: { value: 'Pérez' } })
    fireEvent.change(document.querySelector('[name=teacherEmail]')!, { target: { value: 'ana@example.com' } })
    fireEvent.change(document.querySelector('[name=teacherDni]')!, { target: { value: '30111222' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear profesor' }))
}

describe('QuickCreateTeacherModal', () => {
    it("assigns the new teacher to the commission's branch, like creating it from Sedes → Staff", () => {
        createStaff.mockImplementation((_input, { onSuccess }) => onSuccess({ fullName: 'Ana Pérez', userId: 'u-ana' }))
        assignToBranch.mockImplementation((_input, { onSuccess }) => onSuccess())
        const onCreated = vi.fn()
        render(<QuickCreateTeacherModal open branchId="b1" onClose={() => undefined} onCreated={onCreated} />)
        fillAndSubmit()
        expect(createStaff).toHaveBeenCalledWith(expect.objectContaining({ fullName: 'Ana Pérez', role: 'Docente', dni: '30111222' }), expect.anything())
        expect(assignToBranch).toHaveBeenCalledWith({ branchId: 'b1', userId: 'u-ana', enabled: true }, expect.anything())
        expect(invalidateRoster).toHaveBeenCalledWith('b1')
        expect(onCreated).toHaveBeenCalledWith('Ana Pérez')
    })

    it('only creates the teacher when there is no branch to assign', () => {
        createStaff.mockImplementation((_input, { onSuccess }) => onSuccess({ fullName: 'Ana Pérez', userId: 'u-ana' }))
        render(<QuickCreateTeacherModal open onClose={() => undefined} onCreated={vi.fn()} />)
        fillAndSubmit()
        expect(assignToBranch).not.toHaveBeenCalled()
    })
})
