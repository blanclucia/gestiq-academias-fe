type MetaCellProps = {
    primary: string
    secondary: string
}

export function MetaCell({ primary, secondary }: MetaCellProps) {
    return (
        <div className="student-meta-cell">
            <strong>{primary}</strong>
            <span>{secondary}</span>
        </div>
    )
}

export const ContactCell = MetaCell
