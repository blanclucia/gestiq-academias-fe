type KpiCardProps = {
    title: string
    value: string
    change: string
    positive?: boolean
    variant?: 'compact' | 'wide'
}

export function KpiCard({
    title,
    value,
    change,
    positive = true,
    variant = 'compact',
}: KpiCardProps) {
    return (
            <div className={`kpi-card ${variant === 'wide' ? 'wide' : ''}`}>
                <div className="kpi-header">
                    <span className="kpi-title">{title}</span>
                </div>
                <div className="kpi-value">{value}</div>
                <div className={`kpi-meta ${positive ? 'positive' : 'negative'}`}>
                    {change}
                </div>
            </div>
    )
}
