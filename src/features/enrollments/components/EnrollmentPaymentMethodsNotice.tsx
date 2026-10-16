import { CreditCard } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAcademySettings } from '@/services/academySettingsRepository'
import { useBranches } from '@/services/branchRepository'
import { useWorkspace } from '@/workspace/useWorkspace'
import { getPublicPaymentOptions, requiresPaymentStep } from '../model/publicPaymentOptions'

// Read-only preview of the payment methods the public form will offer for this enrollment, computed with
// the same rule as the form itself, plus a shortcut to configure the missing ones in Mi academia → Cobros.
export function EnrollmentPaymentMethodsNotice({ branchId, amount }: { branchId: string; amount: number }) {
    const { path } = useWorkspace()
    const { settings } = useAcademySettings()
    const { branches } = useBranches()
    if (!settings) return null

    const { payments, general } = settings
    const options = getPublicPaymentOptions(payments)
    const address = branches.find((branch) => branch.id === branchId)?.address.trim() || general.address.trim()
    const missing = [!options.transfer && 'transferencia', !options.mercadoPago && 'Mercado Pago'].filter(Boolean).join(' o ')

    return <div className="payment-methods-notice">
        <strong><CreditCard size={15} />Medios de pago que verá el alumno</strong>
        {!requiresPaymentStep(amount) ? <p>Sin costo: el formulario no pide pago.</p> : <>
            <ul>
                {options.mercadoPago && <li><b>Mercado Pago</b> · link de pago</li>}
                {options.transfer && <li><b>Transferencia</b> · {payments.transferAlias.trim() ? `alias ${payments.transferAlias}` : `CBU / CVU ${payments.transferCbu}`}</li>}
                {options.inPerson && <li><b>Efectivo en sede</b> · {address || 'sin dirección cargada en la sede'}</li>}
            </ul>
            {missing && <p>Para ofrecer {missing}, cargá sus datos en Cobros. <Link to={path('academy?tab=cobros')}>Configurar medios de pago</Link></p>}
        </>}
    </div>
}
