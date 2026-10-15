import { InfoTooltip } from './InfoTooltip'

export type StatusHelpItem = { status: string; description: string }

// Help icon that explains what each status of an entity means, shown next to a status field's label.
export function StatusHelp({ label, items }: { label: string; items: StatusHelpItem[] }) {
    return <InfoTooltip label={label} wide>
        <span className="status-help-list">
            {items.map((item) => <span key={item.status}><strong>{item.status}:</strong> {item.description}</span>)}
        </span>
    </InfoTooltip>
}
