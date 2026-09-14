import { useEffect, useRef, type ReactNode } from 'react'
import { TableActionMenu, TableActionTrigger } from '@/components/ui/DataTable'

export type RowActionItem = {
    label: string
    icon: ReactNode
    onClick?: () => void
    variant?: 'default' | 'danger'
    tone?: 'default' | 'danger'
    disabled?: boolean
}

type RowActionMenuProps = {
    ariaLabel?: string
    active?: boolean
    open?: boolean
    actions: RowActionItem[]
    onToggle: () => void
    onClose?: () => void
}

export function RowActionMenu({ ariaLabel = 'Acciones', active, open, actions, onToggle }: RowActionMenuProps) {
    const isActive = active ?? open ?? false
    const menuRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!isActive) {
            return
        }

        const handlePointerDown = (event: MouseEvent | PointerEvent) => {
            const target = event.target as Node
            if (menuRef.current && !menuRef.current.contains(target)) {
                onToggle()
            }
        }

        const handleFocusIn = (event: FocusEvent) => {
            const target = event.target as Node
            if (menuRef.current && !menuRef.current.contains(target)) {
                onToggle()
            }
        }

        document.addEventListener('mousedown', handlePointerDown)
        document.addEventListener('pointerdown', handlePointerDown)
        document.addEventListener('focusin', handleFocusIn)

        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
            document.removeEventListener('pointerdown', handlePointerDown)
            document.removeEventListener('focusin', handleFocusIn)
        }
    }, [isActive, onToggle])

    return (
        <div
            className="table-actions-menu-wrapper"
            ref={menuRef}
            onClick={(event) => event.stopPropagation()}
            onBlur={(event) => {
                const nextTarget = event.relatedTarget as Node | null
                if (isActive && menuRef.current && nextTarget && !menuRef.current.contains(nextTarget)) {
                    onToggle()
                }
            }}
        >
            <TableActionTrigger
                ariaLabel={ariaLabel}
                active={isActive}
                onClick={onToggle}
            />

            {isActive && (
                <TableActionMenu>
                    {actions.map(({ label, icon, onClick, variant, tone, disabled = false }) => (
                        <button
                            key={label}
                            type="button"
                            className={`menu-action-item${(variant ?? tone ?? 'default') === 'danger' ? ' danger' : ''}`.trim()}
                            onClick={() => {
                                onClick?.()
                                onToggle()
                            }}
                            disabled={disabled}
                        >
                            {icon}
                            {label}
                        </button>
                    ))}
                </TableActionMenu>
            )}
        </div>
    )
}
