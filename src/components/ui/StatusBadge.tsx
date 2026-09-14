export type StatusBadgeTone = 'success' | 'warning' | 'neutral'

type StatusBadgeProps = {
    label: string
    tone?: StatusBadgeTone
}

export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
    return <span className={`status-badge ${tone}`}>{label}</span>
}
