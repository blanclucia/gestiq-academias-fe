import type { ReactNode } from 'react'

type MetricTileProps = {
    icon: ReactNode
    label: string
    value: ReactNode
    caption?: ReactNode
}

// Shared "overview" stat tile: icon in a tinted circle, small label, big value, one-line caption.
// Used for any at-a-glance metrics row (Mi academia, detalle de oferta académica, etc.) — wrap a
// row of these in <MetricTileGrid> instead of reaching for the raw `academy-overview-*` classes.
export function MetricTile({ icon, label, value, caption }: MetricTileProps) {
    return (
        <section className="academy-overview-card">
            <span className="academy-overview-icon">{icon}</span>
            <small>{label}</small>
            <strong>{value}</strong>
            {caption && <p>{caption}</p>}
        </section>
    )
}

export function MetricTileGrid({ children }: { children: ReactNode }) {
    return <div className="academy-overview-grid">{children}</div>
}
