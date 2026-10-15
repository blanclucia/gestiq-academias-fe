import { Copy, Download, ExternalLink, ImageDown, QrCode } from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { useToast } from '@/components/ui/ToastContext'

// QR + public link with copy/download actions, as a Card.
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

    const heading = <SectionHeading icon={<QrCode size={20} />} title="Compartir inscripción" description="Compartí el link por WhatsApp o redes, o descargá el QR para piezas gráficas y cartelería." />

    if (!publicLink) return <Card>{heading}<p className="table-secondary-text">Esta inscripción todavía no tiene un enlace público configurado.</p></Card>

    const body = (
            <div className="share-enrollment-body">
            <div className="share-enrollment-qr">
                {qrDataUrl ? <img src={qrDataUrl} alt="Código QR de la inscripción pública" /> : <QrCode size={54} aria-hidden="true" />}
            </div>
            <div className="share-enrollment-content">
                <a className="share-enrollment-link" href={publicLink} target="_blank" rel="noreferrer">{publicLink}</a>
                <div className="share-enrollment-actions">
                    <button type="button" className="secondary-button compact-button" onClick={() => void copyLink()}><Copy size={15} /> Copiar link</button>
                    <button type="button" className="secondary-button compact-button" disabled={!qrDataUrl} onClick={() => void copyQr()}><ImageDown size={15} /> Copiar QR</button>
                    <button type="button" className="secondary-button compact-button" disabled={!qrDataUrl} onClick={downloadQr}><Download size={15} /> Descargar PNG</button>
                    <a className="primary-button compact-button" href={publicLink} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Abrir</a>
                </div>
            </div>
            </div>
    )

    return <Card>{heading}{body}</Card>
}
