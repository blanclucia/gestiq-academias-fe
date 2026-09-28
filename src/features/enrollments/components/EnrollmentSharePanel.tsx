import { Copy, Download, ExternalLink, ImageDown, QrCode } from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/ToastContext'

export function EnrollmentSharePanel({ publicLink, fileName }: { publicLink: string; fileName: string }) {
    const [qrDataUrl, setQrDataUrl] = useState('')
    const { showToast } = useToast()

    useEffect(() => {
        let active = true
        if (!publicLink) {
            return
        }
        void QRCode.toDataURL(publicLink, { width: 320, margin: 3, errorCorrectionLevel: 'M' })
            .then((value) => { if (active) setQrDataUrl(value) })
            .catch(() => { if (active) showToast('error', 'No se pudo generar el código QR.') })
        return () => { active = false }
    }, [publicLink, showToast])

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(publicLink)
            showToast('success', 'Link copiado.')
        } catch {
            showToast('error', 'No se pudo copiar. Podés descargar el QR.')
        }
    }

    const copyQr = async () => {
        if (!qrDataUrl) return
        try {
            const blob = await fetch(qrDataUrl).then((response) => response.blob())
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
            showToast('success', 'Código QR copiado.')
        } catch {
            showToast('error', 'No se pudo copiar. Podés descargar el QR.')
        }
    }

    const downloadQr = () => {
        if (!qrDataUrl) return
        const link = document.createElement('a')
        link.href = qrDataUrl
        link.download = `${fileName}.png`
        link.click()
    }

    if (!publicLink) return <div className="share-enrollment-empty">Esta inscripción todavía no tiene un enlace público configurado.</div>

    return (
        <section className="share-enrollment-panel">
            <div className="share-enrollment-qr">
                {qrDataUrl ? <img src={qrDataUrl} alt="Código QR de la inscripción pública" /> : <QrCode size={54} aria-hidden="true" />}
            </div>
            <div className="share-enrollment-content">
                <div>
                    <p className="share-enrollment-eyebrow">Compartir inscripción</p>
                    <h3>Link y código QR</h3>
                    <p>Compartí el enlace por WhatsApp o redes, o descargá el QR para piezas gráficas y cartelería.</p>
                </div>
                <a className="share-enrollment-link" href={publicLink} target="_blank" rel="noreferrer">{publicLink}</a>
                <div className="share-enrollment-actions">
                    <button type="button" className="secondary-button compact-button" onClick={() => void copyLink()}><Copy size={15} /> Copiar link</button>
                    <button type="button" className="secondary-button compact-button" disabled={!qrDataUrl} onClick={() => void copyQr()}><ImageDown size={15} /> Copiar QR</button>
                    <button type="button" className="secondary-button compact-button" disabled={!qrDataUrl} onClick={downloadQr}><Download size={15} /> Descargar PNG</button>
                    <a className="primary-button compact-button" href={publicLink} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Abrir</a>
                </div>
            </div>
        </section>
    )
}
