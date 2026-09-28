import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type ToastVariant } from './ToastContext'

type Toast = { id: number; variant: ToastVariant; message: string }

// Errors stay up longer than success messages — worth reading in full before they clear.
const AUTO_DISMISS_MS: Record<ToastVariant, number> = { success: 4000, error: 7000 }

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])
    const nextId = useRef(0)

    const dismiss = useCallback((id: number) => {
        setToasts((current) => current.filter((toast) => toast.id !== id))
    }, [])

    const showToast = useCallback((variant: ToastVariant, message: string) => {
        const id = nextId.current++
        setToasts((current) => [...current, { id, variant, message }])
        window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS[variant])
    }, [dismiss])

    return <ToastContext.Provider value={{ showToast }}>
        {children}
        <div className="toast-viewport">
            {toasts.map((toast) => (
                <div key={toast.id} className={`toast toast-${toast.variant}`} role={toast.variant === 'error' ? 'alert' : 'status'}>
                    {toast.variant === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span>{toast.message}</span>
                    <button type="button" className="toast-close" aria-label="Cerrar notificación" onClick={() => dismiss(toast.id)}><X size={14} /></button>
                </div>
            ))}
        </div>
    </ToastContext.Provider>
}
