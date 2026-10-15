import { Check, ChevronDown, Plus, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { QuickCreateTeacherModal } from '@/features/staff'

export function TeacherMultiSelect({ options, value, onChange }: { options: Array<{ id: string; fullName: string }>; value: string[]; onChange: (value: string[]) => void }) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [isCreateTeacherOpen, setIsCreateTeacherOpen] = useState(false)
    const pickerRef = useRef<HTMLDivElement>(null)
    const filteredOptions = options.filter((teacher) => teacher.fullName.toLocaleLowerCase('es-AR').includes(search.trim().toLocaleLowerCase('es-AR')))
    const summary = value.length === 0 ? 'Seleccionar profesores' : value.length === 1 ? value[0] : `${value.length} profesores seleccionados`

    useEffect(() => {
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!pickerRef.current?.contains(event.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', closeOnOutsideClick)
        return () => document.removeEventListener('mousedown', closeOnOutsideClick)
    }, [])

    return <div className="commission-teacher-select" ref={pickerRef}>
        <button type="button" className="commission-teacher-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
            <span className={value.length === 0 ? 'placeholder' : ''}>{summary}</span>
            <ChevronDown size={16} />
        </button>
        {open && <div className="commission-teacher-dropdown">
            <div className="commission-teacher-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar profesor" aria-label="Buscar profesor" autoFocus /></div>
            <div className="commission-teacher-options" role="listbox" aria-multiselectable="true">
                {filteredOptions.map((teacher) => {
                    const selected = value.includes(teacher.fullName)
                    return <button type="button" role="option" aria-selected={selected} key={teacher.id} onClick={() => onChange(selected ? value.filter((name) => name !== teacher.fullName) : [...value, teacher.fullName])}>
                        <span className={`commission-teacher-checkbox${selected ? ' selected' : ''}`}>{selected && <Check size={12} />}</span>
                        <span>{teacher.fullName}</span>
                    </button>
                })}
                {filteredOptions.length === 0 && <div className="commission-teacher-no-results">No se encontraron profesores.</div>}
            </div>
            <button type="button" className="commission-teacher-create" onClick={() => setIsCreateTeacherOpen(true)}>
                <Plus size={14} /> Crear profesor nuevo
            </button>
        </div>}
        <QuickCreateTeacherModal
            open={isCreateTeacherOpen}
            onClose={() => setIsCreateTeacherOpen(false)}
            onCreated={(fullName) => {
                onChange([...value, fullName])
                setIsCreateTeacherOpen(false)
                setOpen(false)
            }}
        />
    </div>
}
