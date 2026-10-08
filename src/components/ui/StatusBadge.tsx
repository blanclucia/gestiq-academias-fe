export type StatusBadgeTone = 'success' | 'warning' | 'neutral' | 'danger'

type StatusBadgeProps = {
    label: string
    tone?: StatusBadgeTone
}

export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
    return <span className={`status-badge ${tone}`}>{label}</span>
}
