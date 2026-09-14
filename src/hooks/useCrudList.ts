import { useCallback, useMemo, useState } from 'react'

type CrudItem = {
    id: string
}

type SearchValue = string | string[] | null | undefined

type UseCrudListOptions<T extends CrudItem> = {
    items: T[]
    pageSize?: number
    searchFields?: Array<(item: T) => SearchValue>
}

export function useCrudList<T extends CrudItem>({
    items,
    pageSize = 10,
    searchFields = [],
}: UseCrudListOptions<T>) {
    const [search, setSearch] = useState('')
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [currentPage, setCurrentPage] = useState(1)

    const filteredItems = useMemo(() => {
        const query = search.trim().toLowerCase()

        if (!query) {
            return items
        }

        return items.filter((item) => {
            const haystack = searchFields
                .map((getValue) => getValue(item))
                .flatMap((value) => (Array.isArray(value) ? value : [value ?? '']))
                .join(' ')
                .toLowerCase()

            return haystack.includes(query)
        })
    }, [items, search, searchFields])

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
    const safeCurrentPage = Math.min(currentPage, totalPages)

    const paginatedItems = filteredItems.slice(
        (safeCurrentPage - 1) * pageSize,
        safeCurrentPage * pageSize,
    )

    const toggleSelection = useCallback((itemId: string) => {
        setSelectedIds((current) =>
            current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId],
        )
    }, [])

    const toggleSelectAll = useCallback(() => {
        const visibleIds = paginatedItems.map((item) => item.id)
        const allSelected = visibleIds.every((itemId) => selectedIds.includes(itemId))

        if (allSelected) {
            setSelectedIds((current) => current.filter((itemId) => !visibleIds.includes(itemId)))
            return
        }

        setSelectedIds((current) => Array.from(new Set([...current, ...visibleIds])))
    }, [paginatedItems, selectedIds])

    const resetSelection = useCallback(() => setSelectedIds([]), [])

    return {
        search,
        setSearch,
        selectedIds,
        selectedCount: selectedIds.length,
        currentPage: safeCurrentPage,
        setCurrentPage,
        totalPages,
        filteredItems,
        paginatedItems,
        toggleSelection,
        toggleSelectAll,
        resetSelection,
    }
}
