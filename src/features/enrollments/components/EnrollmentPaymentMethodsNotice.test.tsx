// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EnrollmentPaymentMethodsNotice } from './EnrollmentPaymentMethodsNotice'

const settings = {
    general: { address: 'Dirección general 100' },
    payments: { enabledMethods: ['Transferencia', 'Efectivo'], transferAlias: '', transferCbu: '', accountHolder: '', paymentLink: '' },
}

vi.mock('@/services/academySettingsRepository', () => ({ useAcademySettings: () => ({ settings }) }))
vi.mock('@/services/branchRepository', () => ({ useBranches: () => ({ branches: [{ id: 'b1', address: '3 de febrero 2148' }] }) }))
vi.mock('@/workspace/useWorkspace', () => ({ useWorkspace: () => ({ path: (to: string) => `/academy-demo/admin/${to}` }) }))

afterEach(() => {
    cleanup()
    settings.payments = { enabledMethods: ['Transferencia', 'Efectivo'], transferAlias: '', transferCbu: '', accountHolder: '', paymentLink: '' }
})

const renderNotice = (amount = 48000) => render(<MemoryRouter><EnrollmentPaymentMethodsNotice branchId="b1" amount={amount} /></MemoryRouter>)

describe('EnrollmentPaymentMethodsNotice', () => {
    it('lists only the usable methods, with the branch address for paying in person', () => {
        renderNotice()
        expect(screen.getByText(/3 de febrero 2148/)).toBeInTheDocument()
        expect(screen.queryByText('Transferencia')).not.toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Configurar medios de pago' })).toHaveAttribute('href', '/academy-demo/admin/academy?tab=cobros')
    })

    it('shows the transfer alias once it is configured', () => {
        settings.payments = { ...settings.payments, transferAlias: 'ACADEMIA.MP', accountHolder: 'Academia SRL' }
        renderNotice()
        expect(screen.getByText(/alias ACADEMIA\.MP/)).toBeInTheDocument()
    })

    it('says the form asks for no payment when the enrollment is free', () => {
        renderNotice(0)
        expect(screen.getByText('Sin costo: el formulario no pide pago.')).toBeInTheDocument()
    })
})
