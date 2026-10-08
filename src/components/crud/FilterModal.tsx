import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MultiSearchableSelect } from '@/components/ui/MultiSearchableSelect'
import { joinFilterValue, splitFilterValue } from './filterValues'

export type FilterModalField = { key: string; label: string; options: string[] }

type Props = { open: boolean; title: string; fields: FilterModalField[]; values: Record<string, string>; onChange: (values: Record<string, string>) => void; onClose: () => void }

// Standalone filter modal for screens that don't go through CrudListPage (e.g. a detail page with
// its own embedded tables) — same draft/apply split, multi-value fields and "no live changes behind
// the modal" behavior as CrudListPage's own built-in filter modal.
export function FilterModal({ open, title, fields, values, onChange, onClose }: Props) {
    const [draft, setDraft] = useState(values)
    /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
    useEffect(() => {
        if (open) setDraft(values)
    }, [open])
    /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

    if (!open) return null
    return <div className="entity-modal-backdrop" onClick={onClose}>
        <div className="entity-modal" onClick={(event) => event.stopPropagation()}>
            <div className="entity-modal-header"><div><h3>{title}</h3><p>Busca y combina criterios por columna.</p></div><button type="button" className="entity-modal-close" onClick={onClose} aria-label="Cerrar filtros"><X size={18} /></button></div>
            <div className="entity-modal-content"><div className="form-grid">{fields.map((field) => <label key={field.key} className="form-field"><span className="form-field-label">{field.label}</span><MultiSearchableSelect values={splitFilterValue(draft[field.key])} onChange={(selected) => setDraft({ ...draft, [field.key]: joinFilterValue(selected) })} placeholder={`Buscar ${field.label.toLowerCase()}…`} options={Array.from(new Set(field.options)).map((option) => ({ value: option, label: option }))} /></label>)}</div></div>
            <div className="entity-modal-footer"><div className="entity-modal-actions"><button type="button" className="secondary-button" onClick={() => setDraft(Object.fromEntries(fields.map((field) => [field.key, ''])))}>Limpiar</button><button type="button" className="primary-button" onClick={() => { onChange(draft); onClose() }}>Aplicar</button></div></div>
        </div>
    </div>
}
