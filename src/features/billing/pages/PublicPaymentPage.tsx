import { CheckCircle2, Copy, CreditCard, Landmark } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { confirmPaymentRecord, listPayments, updatePaymentRecord, useAcademyRepositoryVersion } from '@/services/academyRepository'
import { getAcademySettings } from '@/services/academySettingsRepository'

type PublicPaymentMethod = 'Mercado Pago' | 'Transferencia'

export function PublicPaymentPage() {
    useAcademyRepositoryVersion()
    const { paymentId } = useParams()
    const payment = listPayments().find((item) => item.id === paymentId)
    const settings = getAcademySettings()
    const availableMethods = (['Mercado Pago', 'Transferencia'] as PublicPaymentMethod[]).filter((item) => settings.payments.enabledMethods.includes(item))
    const [method, setMethod] = useState<PublicPaymentMethod>(() => availableMethods[0] ?? 'Transferencia')
    const [transferReported, setTransferReported] = useState(false)
    const [copied, setCopied] = useState('')

    if (!payment) return <main className="public-enrollment-page"><div className="public-enrollment-card"><h1>Pago no disponible</h1><p>Este link no existe o ya no está vigente.</p></div></main>

    const paid = payment.status === 'Pagado'
    const copyValue = async (label: string, value: string) => {
        await navigator.clipboard.writeText(value)
        setCopied(label)
        window.setTimeout(() => setCopied(''), 1800)
    }

    return <main className="public-enrollment-page"><section className="public-enrollment-card">
        {paid ? <div className="public-enrollment-success"><CheckCircle2 size={40} /><h1>Pago confirmado</h1><p>Registramos el pago de {payment.student}.</p></div> : transferReported ? <div className="public-enrollment-success"><CheckCircle2 size={40} /><h1>Transferencia informada</h1><p>Administración verificará la acreditación antes de confirmar el pago.</p></div> : <div className="public-enrollment-checkout">
            <CreditCard size={28} color="var(--primary)" />
            <h1>Pago online</h1>
            <p>{payment.concept}</p>
            <div className="public-enrollment-summary"><span>Total a pagar</span><strong>${payment.amount.toLocaleString('es-AR')}</strong></div>
            {availableMethods.length > 0 ? <>
                <label className="public-enrollment-field">Medio de pago
                    <select className="form-input" value={method} onChange={(event) => setMethod(event.target.value as PublicPaymentMethod)}>
                        {availableMethods.includes('Mercado Pago') && <option value="Mercado Pago">Mercado Pago</option>}
                        {availableMethods.includes('Transferencia') && <option value="Transferencia">Transferencia bancaria</option>}
                    </select>
                </label>
                {method === 'Transferencia' && <div className="transfer-details">
                    <div className="transfer-details-heading"><Landmark size={18} /><div><strong>Datos para transferir</strong><span>{settings.payments.paymentMessage}</span></div></div>
                    <dl>
                        {settings.payments.transferAlias && <div><dt>Alias</dt><dd>{settings.payments.transferAlias}<button type="button" aria-label="Copiar alias" onClick={() => copyValue('Alias', settings.payments.transferAlias)}><Copy size={14} /></button></dd></div>}
                        {settings.payments.transferCbu && <div><dt>CBU / CVU</dt><dd>{settings.payments.transferCbu}<button type="button" aria-label="Copiar CBU o CVU" onClick={() => copyValue('CBU / CVU', settings.payments.transferCbu)}><Copy size={14} /></button></dd></div>}
                        {settings.payments.accountHolder && <div><dt>Titular</dt><dd>{settings.payments.accountHolder}</dd></div>}
                        {settings.payments.accountTaxId && <div><dt>CUIT / CUIL</dt><dd>{settings.payments.accountTaxId}</dd></div>}
                        <div><dt>Referencia</dt><dd>{payment.id}<button type="button" aria-label="Copiar referencia" onClick={() => copyValue('Referencia', payment.id)}><Copy size={14} /></button></dd></div>
                    </dl>
                    <small>{copied ? `${copied} copiado` : 'Incluí la referencia para que podamos identificar tu pago.'}</small>
                </div>}
                <button className={method === 'Mercado Pago' ? 'mercadopago-button' : 'primary-button'} type="button" onClick={() => {
                if (method === 'Mercado Pago') confirmPaymentRecord(payment.id, 'Tarjeta')
                else {
                    updatePaymentRecord(payment.id, { status: 'En verificación', method: 'Transferencia' })
                    setTransferReported(true)
                }
            }}>{method === 'Mercado Pago' ? 'Pagar con Mercado Pago' : 'Informar transferencia'}</button>
            </> : <div className="public-payment-unavailable">No hay medios de pago online habilitados. Contactá a la academia para coordinar el pago.</div>}
            <small>Entorno de demostración · no se realizará ningún cobro.</small>
        </div>}
    </section></main>
}
