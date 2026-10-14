import type { ReactNode } from 'react'

type SectionHeadingProps = {
    icon: ReactNode
    title: string
    description?: string
    actions?: ReactNode
}

// Shared title treatment for any card/section across the app: icon in the primary color,
// a normal-weight heading (never uppercase) and an optional one-line caption. `actions` renders
// a trailing slot (e.g. a button) next to the heading instead of elsewhere in the card.
export function SectionHeading({ icon, title, description, actions }: SectionHeadingProps) {
    const copy = (
        <>
            {icon}
            <div>
                <h2>{title}</h2>
                {description && <p>{description}</p>}
            </div>
        </>
    )
    if (actions) {
        return (
            <div className="academy-section-heading branch-section-heading">
                <div className="branch-section-heading-copy">{copy}</div>
                {actions}
            </div>
        )
    }
    return <div className="academy-section-heading">{copy}</div>
}
