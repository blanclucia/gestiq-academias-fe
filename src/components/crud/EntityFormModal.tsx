import { X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { FormValidationResult } from '@/components/forms/formValidation'

type EntityFormModalProps = {
    open: boolean
    title: string
    subtitle?: string
    submitLabel?: string
    cancelLabel?: string
    validate?: () => FormValidationResult
    onClose: () => void
    /** Returning a promise (e.g. a mutateAsync) keeps the modal open while saving and on failure. */
    onSubmit?: () => void | Promise<unknown>
    /** Shown when the promise returned by onSubmit rejects. */
    submitErrorMessage?: string
    children: ReactNode
}

const defaultSubmitErrorMessage = 'No se pudo guardar. Intentá nuevamente.'

// Runs a modal action. A promise means the action talks to the backend: the modal disables its
// button until it settles, and on failure stays open with the error instead of closing as if the
// change had been saved. The caller closes the modal once the promise resolves.
function useModalAction(onError: (message: string) => void) {
    const [pending, setPending] = useState(false)
    const run = (action: () => void | Promise<unknown>, errorMessage: string) => {
        const result = action()
        if (!(result instanceof Promise)) return
        setPending(true)
        result.catch(() => onError(errorMessage)).finally(() => setPending(false))
    }
    return { pending, run }
}

export function EntityFormModal({
    open,
    title,
    subtitle,
    submitLabel = 'Guardar',
    cancelLabel = 'Cancelar',
    validate,
    onClose,
    onSubmit,
    submitErrorMessage = defaultSubmitErrorMessage,
    children,
}: EntityFormModalProps) {
    const [submitError, setSubmitError] = useState('')
    const action = useModalAction(setSubmitError)
    const contentRef = useRef<HTMLDivElement>(null)
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (!open) setSubmitError('')
    }, [open])
    /* eslint-enable react-hooks/set-state-in-effect */

    useEffect(() => {
        if (!open) return
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose, open])

    if (!open) {
        return null
    }

    return (
        <div className="entity-modal-backdrop" onClick={onClose}>
            <div className="entity-modal" onClick={(event) => event.stopPropagation()}>
                <div className="entity-modal-header">
                    <div>
                        <h3>{title}</h3>
                        {subtitle && <p>{subtitle}</p>}
                    </div>

                    <button type="button" className="entity-modal-close" onClick={onClose} aria-label="Cerrar">
                        <X size={18} />
                    </button>
                </div>

                <div className="entity-modal-content" ref={contentRef}>{children}</div>

                <div className="entity-modal-footer">
                    {submitError && <p className="entity-modal-validation-error" role="alert">{submitError}</p>}
                    <div className="entity-modal-actions">
                        <button type="button" className="secondary-button" onClick={onClose}>
                            {cancelLabel}
                        </button>
                        <button type="button" className="primary-button" disabled={action.pending} onClick={() => {
                            const result = validate?.()
                            const namedFields = Array.from(contentRef.current?.querySelectorAll<HTMLElement>('[name]') ?? [])
                            // Clear any marks from a previous failed attempt before applying this one.
                            namedFields.forEach((field) => field.classList.remove('field-invalid'))
                            if (result?.valid === false) {
                                const invalidKeys = result.fieldErrors ? Object.keys(result.fieldErrors) : []
                                // Every caller already computes a specific reason per invalid field (e.g.
                                // "Ingresá una fecha de fin válida.") — show those instead of the generic
                                // summary passed as a fallback, which told the user nothing about what to fix.
                                const fieldMessages = invalidKeys.map((key) => result.fieldErrors?.[key]).filter((message): message is string => Boolean(message))
                                setSubmitError(fieldMessages.length > 0 ? fieldMessages.join(' ') : (result.message ?? 'Revisá los campos obligatorios.'))
                                // Mark every invalid field, not just the first — a red border is a much
                                // harder thing to miss than a focus ring that can land below the fold or
                                // get silently lost to a re-render, and the user may have more than one
                                // field to fix at once.
                                invalidKeys.forEach((key) => namedFields.find((field) => field.getAttribute('name') === key)?.classList.add('field-invalid'))
                                namedFields.find((field) => field.getAttribute('name') === invalidKeys[0])?.focus()
                                return
                            }
                            setSubmitError('')
                            if (onSubmit) action.run(onSubmit, submitErrorMessage)
                        }}>
                            {action.pending ? 'Guardando…' : submitLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

type DeleteConfirmationModalProps = {
    open: boolean
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
    onClose: () => void
    /** Returning a promise keeps the modal open until it settles, showing the error if it fails. */
    onConfirm: () => void | Promise<unknown>
    confirmErrorMessage?: string
}

export function DeleteConfirmationModal({
    open,
    title,
    description,
    confirmLabel = 'Eliminar',
    cancelLabel = 'Cancelar',
    onClose,
    onConfirm,
    confirmErrorMessage = 'No se pudo completar la acción. Intentá nuevamente.',
}: DeleteConfirmationModalProps) {
    const [confirmError, setConfirmError] = useState('')
    const action = useModalAction(setConfirmError)
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (!open) setConfirmError('')
    }, [open])
    /* eslint-enable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (!open) return
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose, open])

    if (!open) {
        return null
    }

    return (
        <div className="entity-modal-backdrop" onClick={onClose}>
            <div className="entity-modal" onClick={(event) => event.stopPropagation()}>
                <div className="entity-modal-header">
                    <div>
                        <h3>{title}</h3>
                    </div>

                    <button type="button" className="entity-modal-close" onClick={onClose} aria-label="Cerrar">
                        <X size={18} />
                    </button>
                </div>

                <div className="entity-modal-content">
                    <p style={{ margin: 0, color: 'var(--muted)' }}>{description}</p>
                </div>

                <div className="entity-modal-footer">
                    {confirmError && <p className="entity-modal-validation-error" role="alert">{confirmError}</p>}
                    <div className="entity-modal-actions">
                        <button type="button" className="secondary-button" onClick={onClose}>
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            className="primary-button"
                            disabled={action.pending}
                            onClick={() => action.run(onConfirm, confirmErrorMessage)}
                            style={{
                                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                borderColor: '#ef4444',
                            }}
                        >
                            {action.pending ? 'Procesando…' : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

type FormSectionProps = {
    title: string
    description?: string
    children: ReactNode
}

export function FormSection({ title, description, children }: FormSectionProps) {
    return (
        <section className="form-section">
            <div className="form-section-header">
                <h4>{title}</h4>
                {description && <p>{description}</p>}
            </div>
            <div className="form-section-body">{children}</div>
        </section>
    )
}

type FormFieldProps = {
    label: string
    children: ReactNode
    hint?: string
    full?: boolean
    required?: boolean
    error?: string
    // Optional help next to the label (e.g. <StatusHelp />).
    info?: ReactNode
}

export function FormField({ label, hint, children, full = false, required = false, error, info }: FormFieldProps) {
    return (
        <label className={`form-field ${full ? 'form-field-full' : ''}`}>
            <span className="form-field-label">
                <span className="form-field-label-text">{label}{required && <b aria-hidden="true" className="form-required-mark"> *</b>}{info}</span>
                {hint && <small>{hint}</small>}
            </span>
            {children}
            {error && <small className="form-field-error" role="alert">{error}</small>}
        </label>
    )
}

export function FormGrid({ children }: { children: ReactNode }) {
    return <div className="form-grid">{children}</div>
}
