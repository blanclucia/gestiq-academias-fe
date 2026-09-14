import { X } from 'lucide-react'

export type OfferFilterField = { key: string; label: string; options: string[] }

type Props = { open: boolean; title: string; fields: OfferFilterField[]; values: Record<string, string>; onChange: (values: Record<string, string>) => void; onClose: () => void }

export function OfferFiltersModal({ open, title, fields, values, onChange, onClose }: Props) {
    if (!open) return null
    return <div className="entity-modal-backdrop" onClick={onClose}>
        <div className="entity-modal" onClick={(event) => event.stopPropagation()}>
            <div className="entity-modal-header"><div><h3>{title}</h3><p>Busca y combina criterios por columna.</p></div><button type="button" className="entity-modal-close" onClick={onClose} aria-label="Cerrar filtros"><X size={18} /></button></div>
            <div className="entity-modal-content"><div className="form-grid">{fields.map((field) => <label key={field.key} className="form-field"><span className="form-field-label">{field.label}</span><select className="form-input" value={values[field.key] ?? ''} onChange={(event) => onChange({ ...values, [field.key]: event.target.value })}><option value="">Todas</option>{Array.from(new Set(field.options)).map((option) => <option key={`${field.key}-${option}`} value={option}>{option}</option>)}</select></label>)}</div></div>
            <div className="entity-modal-footer"><button type="button" className="secondary-button" onClick={() => onChange(Object.fromEntries(fields.map((field) => [field.key, ''])))}>Limpiar</button><button type="button" className="primary-button" onClick={onClose}>Aplicar</button></div>
        </div>
    </div>
}
