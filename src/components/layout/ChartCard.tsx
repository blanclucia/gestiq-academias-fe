import type { ReactNode } from 'react'

type ChartCardProps = {
    title: string
    subtitle?: string
    value?: string
    action?: ReactNode
    children?: ReactNode
    className?: string
}

export function ChartCard({
    title,
    subtitle,
    value,
    action,
    children,
    className = '',
}: ChartCardProps) {
    return (
        <section className={`chart-card ${className}`.trim()}>
            <div className="card-header-row">
                <div>
                    <h3>{title}</h3>
                    {subtitle && <p>{subtitle}</p>}
                </div>
                {/* The action keeps the top-right corner (like the other cards); a metric sits under it. */}
                {value && action ? <div className="card-header-side">{action}<div className="card-metric">{value}</div></div> : action ?? (value ? <div className="card-metric">{value}</div> : null)}
            </div>
            {children}
        </section>
    )
}
