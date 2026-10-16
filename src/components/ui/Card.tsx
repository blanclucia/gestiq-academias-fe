import type { CSSProperties, ReactNode } from 'react'

type CardProps = {
    children: ReactNode
    className?: string
    style?: CSSProperties
}

// The one "real" card background (solid, matches Mi academia/Mi sede/Mi perfil) — use this
// instead of reaching for `.data-table-card` (translucent, meant for table-list wrappers) or
// typing the class name by hand, so a page's cards can't silently end up on two different
// backgrounds the way Oferta académica's did.
export function Card({ children, className, style }: CardProps) {
    return <section className={className ? `academy-settings-card ${className}` : 'academy-settings-card'} style={style}>{children}</section>
}
