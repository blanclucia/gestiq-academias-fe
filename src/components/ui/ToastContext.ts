import { createContext, useContext } from 'react'

export type ToastVariant = 'success' | 'error'

type ToastContextValue = {
    showToast: (variant: ToastVariant, message: string) => void
}

export const ToastContext = createContext<ToastContextValue>({ showToast: () => undefined })

export function useToast() {
    return useContext(ToastContext)
}
