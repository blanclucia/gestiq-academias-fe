import { Plus, Search, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { ActionButtonGroup, type ActionButtonItem } from '@/components/ui/ActionButtonGroup'
import { MultiSearchableSelect } from '@/components/ui/MultiSearchableSelect'
import { FilterChips } from './FilterChips'
import { joinFilterValue, splitFilterValue } from './filterValues'

export type TableFilterField = {
    key: string
    label: string
    placeholder?: string
    options?: string[] | ((filters: Record<string, string>) => string[])
}

type ToolbarConfig = {
    filters?: ActionButtonItem
    import?: ActionButtonItem
    create?: ActionButtonItem
}

type CrudListPageProps = {
    className?: string
    contentInset?: boolean
    title: string
    description?: string
    compactHeader?: boolean
    searchValue: string
    onSearchChange: (value: string) => void
    searchPlaceholder?: string
    onCreate?: () => void
    onImport?: () => void
    onFilters?: () => void
    filterFields?: TableFilterField[]
    onApplyFilters?: (filters: Record<string, string>) => void
    toolbar?: ToolbarConfig
    children: ReactNode
    bulkActions?: ReactNode
    bulkActionItems?: ActionButtonItem[]
    selectedCount?: number
    footer?: ReactNode
    postHeaderContent?: ReactNode
    preToolbarContent?: ReactNode
    toolbarCenterContent?: ReactNode
    hideToolbar?: boolean
}

export function CrudListPage({
    className = '',
    contentInset = false,
    title,
    description,
    compactHeader = false,
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Buscar...',
    onCreate,
    onImport,
    onFilters,
    filterFields = [],
    onApplyFilters,
    toolbar,
    children,
    bulkActions,
    bulkActionItems,
    selectedCount = 0,
    footer,
    postHeaderContent,
    preToolbarContent,
    toolbarCenterContent,
    hideToolbar = false,
}: CrudListPageProps) {
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
    const emptyFilters = () => Object.fromEntries(filterFields.map((field) => [field.key, '']))
    // appliedFilters is what the table (and the chips next to "Filtros") actually reflects.
    // filterValues is the modal's own draft, only committed to appliedFilters on "Aplicar" — kept
    // apart so ticking options inside the still-open modal doesn't change the chips behind it.
    const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>(emptyFilters)
    const [filterValues, setFilterValues] = useState<Record<string, string>>(emptyFilters)
    /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
    useEffect(() => {
        if (isFilterModalOpen) setFilterValues(appliedFilters)
    }, [isFilterModalOpen])
    /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

    const normalizedToolbar: ToolbarConfig = {
        ...toolbar,
        filters: toolbar?.filters ?? (onFilters ? { label: 'Filtros', onClick: onFilters, variant: 'secondary' } : undefined),
        import: toolbar?.import ?? (onImport ? { label: 'Importar', onClick: onImport, variant: 'secondary' } : undefined),
        create: toolbar?.create ?? (onCreate ? { label: 'Nuevo', onClick: onCreate, variant: 'primary' } : undefined),
    }

    if (normalizedToolbar.create) {
        normalizedToolbar.create = {
            ...normalizedToolbar.create,
            icon: normalizedToolbar.create.icon ?? <Plus size={16} />,
            className: `context-primary-action ${normalizedToolbar.create.className ?? ''}`.trim(),
        }
    }

    const leftActions: ActionButtonItem[] = []
    const rightActions: ActionButtonItem[] = []

    const openFilterModal = () => {
        if (filterFields.length > 0) {
            setIsFilterModalOpen(true)
            return
        }

        onFilters?.()
    }

    const applyFilterValues = (next: Record<string, string>) => {
        setAppliedFilters(next)
        onApplyFilters?.(next)
    }

    if (normalizedToolbar.filters) {
        leftActions.push({
            ...normalizedToolbar.filters,
            onClick: normalizedToolbar.filters.onClick ?? openFilterModal,
        })
    }

    if (normalizedToolbar.import) {
        rightActions.push(normalizedToolbar.import)
    }

    if (normalizedToolbar.create) {
        rightActions.push(normalizedToolbar.create)
    }

    return (
        <div className={`dashboard-page ${contentInset ? 'crud-list-page--inset' : ''} ${className}`.trim()}>
            {!compactHeader && (
                <div className="page-header">
                    <div>
                        <h1>{title}</h1>
                        {description && <p>{description}</p>}
                    </div>
                </div>
            )}

            {postHeaderContent}

            <div className="data-table-card">
                {preToolbarContent}

                {!hideToolbar && (
                    <div className="student-table-toolbar">
                        <div className="student-table-toolbar-left">
                            <label
                                className="search-input-wrap"
                                style={{
                                    flex: '0 0 420px',
                                    width: '420px',
                                    maxWidth: '46%',
                                    minWidth: '260px',
                                }}
                            >
                                <Search aria-hidden="true" size={16} strokeWidth={2.2} className="search-input-icon" />
                                <input
                                    type="text"
                                    value={searchValue}
                                    onChange={(event) => onSearchChange(event.target.value)}
                                    placeholder={searchPlaceholder}
                                />
                            </label>

                            {leftActions.length > 0 && <ActionButtonGroup actions={leftActions} compact />}

                            <FilterChips fields={filterFields} values={appliedFilters} onChange={applyFilterValues} />
                        </div>

                        {toolbarCenterContent && (
                            <div className="student-table-toolbar-center">
                                {toolbarCenterContent}
                            </div>
                        )}

                        <div className="student-table-toolbar-right">
                            {rightActions.length > 0 && <ActionButtonGroup actions={rightActions} compact />}
                        </div>
                    </div>
                )}

                {selectedCount > 0 && (bulkActions || bulkActionItems) && (
                    <div className="bulk-action-bar">
                        <span>{selectedCount} seleccionados</span>
                        <div className="bulk-action-group">
                            {bulkActions ?? <ActionButtonGroup actions={bulkActionItems ?? []} compact />}
                        </div>
                    </div>
                )}

                {children}

                {footer && <div className="data-table-footer">{footer}</div>}
            </div>

            {isFilterModalOpen && (
                <div className="entity-modal-backdrop" onClick={() => setIsFilterModalOpen(false)}>
                    <div className="entity-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="entity-modal-header">
                            <div>
                                <h3>Filtros</h3>
                                <p>Busca y combina criterios por columna.</p>
                            </div>

                            <button type="button" className="entity-modal-close" onClick={() => setIsFilterModalOpen(false)} aria-label="Cerrar filtros">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="entity-modal-content">
                            <div className="form-grid">
                                {filterFields.map((field) => (
                                    (() => {
                                        const fieldOptions =
                                            typeof field.options === 'function'
                                                ? field.options(filterValues)
                                                : field.options

                                        return (
                                            <label key={field.key} className="form-field">
                                                <span className="form-field-label">{field.label}</span>
                                                {fieldOptions && fieldOptions.length > 0 ? (
                                                    <MultiSearchableSelect
                                                        values={splitFilterValue(filterValues[field.key])}
                                                        onChange={(values) =>
                                                            setFilterValues((current) => ({
                                                                ...current,
                                                                [field.key]: joinFilterValue(values),
                                                            }))
                                                        }
                                                        placeholder={`Buscar ${field.label.toLowerCase()}…`}
                                                        options={Array.from(new Set(fieldOptions)).map((option) => ({ value: option, label: option }))}
                                                    />
                                                ) : (
                                                    <input
                                                        className="form-input"
                                                        type="text"
                                                        value={filterValues[field.key] ?? ''}
                                                        placeholder={field.placeholder ?? `Filtrar por ${field.label.toLowerCase()}`}
                                                        onChange={(event) =>
                                                            setFilterValues((current) => ({
                                                                ...current,
                                                                [field.key]: event.target.value,
                                                            }))
                                                        }
                                                    />
                                                )}
                                            </label>
                                        )
                                    })()
                                ))}
                            </div>
                        </div>

                        <div className="entity-modal-footer">
                            <div className="entity-modal-actions">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => {
                                        setFilterValues(Object.fromEntries(filterFields.map((field) => [field.key, ''])))
                                    }}
                                >
                                    Limpiar
                                </button>
                                <button
                                    type="button"
                                    className="primary-button"
                                    onClick={() => {
                                        setAppliedFilters(filterValues)
                                        onApplyFilters?.(filterValues)
                                        setIsFilterModalOpen(false)
                                    }}
                                >
                                    Aplicar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
