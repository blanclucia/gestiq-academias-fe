import type { ReactNode } from 'react'

type SettingsFieldProps = {
    label: string
    hint?: string
    children: ReactNode
    full?: boolean
}

export function SettingsField({ label, hint, children, full = false }: SettingsFieldProps) {
    return <label className={`form-field ${full ? 'academy-field-full' : ''}`}><span className="form-field-label">{label}{hint && <small>{hint}</small>}</span>{children}</label>
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
