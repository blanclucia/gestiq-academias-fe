import { CheckCircle2, Copy, CreditCard, Landmark } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchPublicCharge, payPublicChargeApi, reportPublicChargeTransferApi } from '@/services/organization/chargesApi'
import { usePublicEnrollmentSettings } from '@/services/organization/publicSettingsApi'
import { paymentMethodsFromApi } from '@/services/organization/settingsMapping'

type PublicPaymentMethod = 'Mercado Pago' | 'Transferencia'

function usePublicCharge(organizationSlug: string | undefined, chargeId: string | undefined) {
    return useQuery({
        queryKey: ['public-charge', organizationSlug, chargeId],
        queryFn: ({ signal }) => fetchPublicCharge(organizationSlug!, chargeId!, signal),
        enabled: Boolean(organizationSlug && chargeId),
        retry: false,
    })
}

export function PublicPaymentPage() {
    const { organizationSlug, paymentId } = useParams()
    const chargeQuery = usePublicCharge(organizationSlug, paymentId)
    const settingsQuery = usePublicEnrollmentSettings(organizationSlug)
    const queryClient = useQueryClient()
    const payMutation = useMutation({
        mutationFn: () => payPublicChargeApi(organizationSlug!, paymentId!),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['public-charge', organizationSlug, paymentId] }),
    })
    const reportTransferMutation = useMutation({
        mutationFn: () => reportPublicChargeTransferApi(organizationSlug!, paymentId!),
        onSuccess: () => { setTransferReported(true) },
    })
    const availableMethods = (['Mercado Pago', 'Transferencia'] as PublicPaymentMethod[]).filter((item) => paymentMethodsFromApi(settingsQuery.data?.payments.enabledMethods ?? []).includes(item))
    const [method, setMethod] = useState<PublicPaymentMethod>(() => availableMethods[0] ?? 'Transferencia')
    const [transferReported, setTransferReported] = useState(false)
    const [copied, setCopied] = useState('')

    if (chargeQuery.isPending || settingsQuery.isPending) return <main className="public-enrollment-page"><div className="public-enrollment-card"><h1>Cargando…</h1></div></main>

    const charge = chargeQuery.data
    const settings = settingsQuery.data
    if (chargeQuery.isError || !charge || settingsQuery.isError || !settings) return <main className="public-enrollment-page"><div className="public-enrollment-card"><h1>Pago no disponible</h1><p>Este link no existe o ya no está vigente.</p></div></main>

    const paid = charge.status === 'paid'
    const copyValue = async (label: string, value: string) => {
        await navigator.clipboard.writeText(value)
        setCopied(label)
        window.setTimeout(() => setCopied(''), 1800)
    }

    return <main className="public-enrollment-page"><section className="public-enrollment-card">
        {paid ? <div className="public-enrollment-success"><CheckCircle2 size={40} /><h1>Pago confirmado</h1><p>Registramos el pago de {charge.studentName}.</p></div> : transferReported ? <div className="public-enrollment-success"><CheckCircle2 size={40} /><h1>Transferencia informada</h1><p>Administración verificará la acreditación antes de confirmar el pago.</p></div> : <div className="public-enrollment-checkout">
            <CreditCard size={28} color="var(--primary)" />
            <h1>Pago online</h1>
            <p>{charge.concept}</p>
            <div className="public-enrollment-summary"><span>Total a pagar</span><strong>${charge.amount.toLocaleString('es-AR')}</strong></div>
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
                        <div><dt>Referencia</dt><dd>{paymentId}<button type="button" aria-label="Copiar referencia" onClick={() => copyValue('Referencia', paymentId ?? '')}><Copy size={14} /></button></dd></div>
                    </dl>
                    <small>{copied ? `${copied} copiado` : 'Incluí la referencia para que podamos identificar tu pago.'}</small>
                </div>}
                <button className={method === 'Mercado Pago' ? 'mercadopago-button' : 'primary-button'} type="button" onClick={() => {
                if (method === 'Mercado Pago') payMutation.mutate()
                else reportTransferMutation.mutate()
            }}>{method === 'Mercado Pago' ? 'Pagar con Mercado Pago' : 'Informar transferencia'}</button>
            </> : <div className="public-payment-unavailable">No hay medios de pago online habilitados. Contactá a la academia para coordinar el pago.</div>}
            <small>Entorno de demostración · no se realizará ningún cobro.</small>
        </div>}
    </section></main>
}
