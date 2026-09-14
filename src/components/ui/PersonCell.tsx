type EntityCellProps = {
    name: string
    subtitle?: string
    avatar?: string
}

export function EntityCell({ name, subtitle, avatar }: EntityCellProps) {
    const initial = avatar ?? name.charAt(0).toUpperCase()

    return (
        <div className="student-cell">
            <div className="student-avatar">{initial}</div>
            <div>
                <strong>{name}</strong>
                {subtitle && <span>{subtitle}</span>}
            </div>
        </div>
    )
}

export const PersonCell = EntityCell
