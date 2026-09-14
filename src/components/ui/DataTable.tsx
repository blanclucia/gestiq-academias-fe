import { MoreHorizontal } from 'lucide-react'
import { type ReactNode } from 'react'

type Column<T> = {
    key: string
    header: ReactNode
    accessor: (row: T) => ReactNode
    align?: 'left' | 'center' | 'right'
    className?: string
}

type DataTablePageConfig = {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
}

type DataTableProps<T> = {
    title?: string
    subtitle?: string
    columns: Column<T>[]
    rows: T[]
    getRowKey: (row: T) => string
    onAdd?: () => void
    onExport?: () => void
    filters?: ReactNode
    renderActions?: (row: T) => ReactNode
    onRowClick?: (row: T) => void
    footer?: ReactNode
    emptyLabel?: string
    pagination?: DataTablePageConfig
}

export function DataTable<T>({
    title,
    subtitle,
    columns,
    rows,
    getRowKey,
    onAdd,
    onExport,
    filters,
    renderActions,
    onRowClick,
    footer,
    emptyLabel = 'No hay registros para mostrar.',
    pagination,
}: DataTableProps<T>) {
    const showPagination = pagination && pagination.totalPages > 1

    return (
        <section className="data-table-shell">
            {(title || subtitle) && (
                <div className="data-table-header">
                    <div className="data-table-title-wrap">
                        {title && <h2>{title}</h2>}
                        {subtitle && <p>{subtitle}</p>}
                    </div>

                    <div className="data-table-actions" aria-hidden="true">
                        {onExport && <span />}
                        {onAdd && <span />}
                    </div>
                </div>
            )}

            {filters && <div className="data-table-filters">{filters}</div>}

            <div className="data-table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={column.align ? `text-${column.align}` : undefined}
                                >
                                    {column.header}
                                </th>
                            ))}
                            {renderActions && <th className="text-right">Acciones</th>}
                        </tr>
                    </thead>

                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (renderActions ? 1 : 0)} className="empty-table-cell">
                                    {emptyLabel}
                                </td>
                            </tr>
                        ) : (
                            rows.map((row) => (
                                <tr
                                    key={getRowKey(row)}
                                    onClick={(event) => {
                                        const target = event.target as HTMLElement

                                        if (target.closest('input, button, a, select, textarea, label')) {
                                            return
                                        }

                                        onRowClick?.(row)
                                    }}
                                    style={onRowClick ? { cursor: 'pointer' } : undefined}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={`${getRowKey(row)}-${column.key}`}
                                            className={column.className ? `${column.className} ${column.align ? `text-${column.align}` : ''}` : column.align ? `text-${column.align}` : undefined}
                                        >
                                            {column.accessor(row)}
                                        </td>
                                    ))}
                                    {renderActions && (
                                        <td className="text-right">
                                            <div
                                                className="table-actions-cell"
                                                onClick={(event) => event.stopPropagation()}
                                            >
                                                {renderActions(row)}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showPagination && (
                <div className="data-table-footer">
                    <div className="table-pagination">
                        <button
                            type="button"
                            className="secondary-button compact-button"
                            onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
                            disabled={pagination.currentPage === 1}
                        >
                            Anterior
                        </button>

                        <span>
                            Página {pagination.currentPage} de {pagination.totalPages}
                        </span>

                        <button
                            type="button"
                            className="secondary-button compact-button"
                            onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
                            disabled={pagination.currentPage === pagination.totalPages}
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}

            {!showPagination && footer && <div className="data-table-footer">{footer}</div>}
        </section>
    )
}

export function TableActionMenu({ children }: { children: ReactNode }) {
    return <div className="table-action-menu">{children}</div>
}

export function TableActionTrigger({
    onClick,
    active,
    ariaLabel,
}: {
    onClick: () => void
    active?: boolean
    ariaLabel: string
}) {
    return (
        <button
            type="button"
            className={`table-action-trigger ${active ? 'is-open' : ''}`.trim()}
            onClick={onClick}
            aria-label={ariaLabel}
            title={ariaLabel}
        >
            <MoreHorizontal size={16} />
        </button>
    )
}
