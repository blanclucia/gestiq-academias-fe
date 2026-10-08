import type { ReactNode } from 'react'

type SettingsFieldProps = {
    label: string
    hint?: string
    required?: boolean
    children: ReactNode
    full?: boolean
}

export function SettingsField({ label, hint, required = false, children, full = false }: SettingsFieldProps) {
    // Always render the hint line, even empty — otherwise a field without a hint sits in the same
    // grid row as one that has it, and their inputs end up misaligned (the hinted field's label
    // block is taller). Reserving the space keeps every row's inputs level regardless of hint text.
    return <label className={`form-field ${full ? 'academy-field-full' : ''}`}><span className="form-field-label"><span>{label}{required && <b aria-hidden="true" className="form-required-mark"> *</b>}</span><small aria-hidden={!hint}>{hint || ' '}</small></span>{children}</label>
}

type SettingsToggleOptionProps = {
    checked: boolean
    label: string
    description?: string
    onChange: (checked: boolean) => void
}

export function SettingsToggleOption({ checked, label, description, onChange }: SettingsToggleOptionProps) {
    return <label className="academy-toggle-option"><span><strong>{label}</strong>{description && <small>{description}</small>}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>
}
