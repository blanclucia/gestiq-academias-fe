import { X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import type { FormValidationResult } from '@/components/forms/formValidation'

type EntityFormModalProps = {
    open: boolean
    title: string
    subtitle?: string
    submitLabel?: string
    cancelLabel?: string
    validate?: () => FormValidationResult
    onClose: () => void
    onSubmit?: () => void
    children: ReactNode
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
    children,
}: EntityFormModalProps) {
    const [submitError, setSubmitError] = useState('')
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

                <div className="entity-modal-content">{children}</div>

                <div className="entity-modal-footer">
                    {submitError && <p className="entity-modal-validation-error" role="alert">{submitError}</p>}
                    <div className="entity-modal-actions">
                        <button type="button" className="secondary-button" onClick={onClose}>
                            {cancelLabel}
                        </button>
                        <button type="button" className="primary-button" onClick={() => {
                            const result = validate?.()
                            if (result?.valid === false) {
                                setSubmitError(result.message ?? 'Revisá los campos obligatorios.')
                                const firstInvalidField = result?.fieldErrors && Object.keys(result.fieldErrors)[0]
                                if (firstInvalidField) Array.from(document.querySelectorAll<HTMLElement>('[name]')).find((field) => field.getAttribute('name') === firstInvalidField)?.focus()
                                return
                            }
                            setSubmitError('')
                            onSubmit?.()
                        }}>
                            {submitLabel}
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
    onConfirm: () => void
}

export function DeleteConfirmationModal({
    open,
    title,
    description,
    confirmLabel = 'Eliminar',
    cancelLabel = 'Cancelar',
    onClose,
    onConfirm,
}: DeleteConfirmationModalProps) {
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
                    <button type="button" className="secondary-button" onClick={onClose}>
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className="primary-button"
                        onClick={onConfirm}
                        style={{
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            borderColor: '#ef4444',
                        }}
                    >
                        {confirmLabel}
                    </button>
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
}

export function FormField({ label, hint, children, full = false, required = false, error }: FormFieldProps) {
    return (
        <label className={`form-field ${full ? 'form-field-full' : ''}`}>
            <span className="form-field-label">
                <span>{label}{required && <b aria-hidden="true" className="form-required-mark"> *</b>}</span>
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
