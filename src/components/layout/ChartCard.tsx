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
                    {/* With a metric, the metric keeps the right side and the action goes under the text. */}
                    {value && action && <div className="card-inline-action">{action}</div>}
                </div>
                {value ? <div className="card-metric">{value}</div> : action}
            </div>
            {children}
        </section>
    )
}
