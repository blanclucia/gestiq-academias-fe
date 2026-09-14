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
                {action ?? (value ? <div className="card-metric">{value}</div> : null)}
            </div>
            {children}
        </section>
    )
}
