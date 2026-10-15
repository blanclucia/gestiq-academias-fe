import { CircleHelp, Info } from 'lucide-react'
import { useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// Shows its description on hover/focus. Portaled to document.body with a fixed position computed
// from the trigger's own position — a plain absolutely-positioned panel gets clipped by any
// ancestor with overflow:hidden/auto (e.g. EntityFormModal's scrollable .entity-modal), which a
// portal escapes. Reusable anywhere a label needs a short explanation without permanently
// visible hint text cluttering the form.
export function InfoTooltip({ label = 'Más información', wide = false, children }: { label?: string; wide?: boolean; children: ReactNode }) {
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const tooltipId = useId()

    const show = () => {
        const rect = triggerRef.current?.getBoundingClientRect()
        if (rect) setPosition({ top: rect.bottom + 9, left: rect.left + rect.width / 2 })
    }
    const hide = () => setPosition(null)

    return (
        <span className="info-tooltip">
            <button
                ref={triggerRef}
                type="button"
                className="info-tooltip-trigger"
                aria-label={label}
                aria-describedby={position ? tooltipId : undefined}
                onMouseEnter={show}
                onMouseLeave={hide}
                onFocus={show}
                onBlur={hide}
            >
                <CircleHelp size={14} />
            </button>
            {position && createPortal(
                <span className={`info-tooltip-panel${wide ? ' wide' : ''}`} role="tooltip" id={tooltipId} style={{ top: position.top, left: position.left }}>
                    <Info size={14} className="info-tooltip-icon" />
                    <span>{children}</span>
                </span>,
                document.body,
            )}
        </span>
    )
}
