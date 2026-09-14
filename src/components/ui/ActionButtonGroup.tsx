import type { ReactNode } from 'react'

export type ActionButtonItem = {
    label: string
    onClick?: () => void
    variant?: 'primary' | 'secondary' | 'danger'
    icon?: ReactNode
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    className?: string
}

type ActionButtonGroupProps = {
    actions: ActionButtonItem[]
    className?: string
    compact?: boolean
}

export function ActionButtonGroup({
    actions,
    className = '',
    compact = true,
}: ActionButtonGroupProps) {
    return (
        <div className={`action-button-group ${className}`.trim()}>
            {actions.map(({ label, onClick, variant = 'secondary', icon, disabled = false, type = 'button', className: actionClassName = '' }) => (
                <button
                    key={label}
                    type={type}
                    className={[
                        variant === 'primary' ? 'primary-button' : variant === 'danger' ? 'danger-button' : 'secondary-button',
                        compact ? 'compact-button' : '',
                        actionClassName,
                    ]
                        .filter(Boolean)
                        .join(' ')}
                    onClick={onClick}
                    disabled={disabled}
                >
                    {icon && <span className="button-icon">{icon}</span>}
                    {label}
                </button>
            ))}
        </div>
    )
}
