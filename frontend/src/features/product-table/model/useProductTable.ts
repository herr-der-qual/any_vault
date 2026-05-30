import {useState, useEffect, useCallback, useRef} from 'react'
import {getProducts} from '@/app/api/products'
import {getGroupMembers} from '@/app/api/groups'
import {updateTableView} from '@/app/api/tableViews'
import {useAuthenticationStore} from '@/app/store/authenticationStore'
import type {ProductRow} from '@/app/api/products'
import type {TableView, TableViewConfig} from '@/app/api/tableViews'
import type {ViewConfig, ColumnConfig, ColumnId} from './types'
import {DEFAULT_VIEW_CONFIG} from './defaultView'

function configFromView(view: TableView): ViewConfig {
    const cfg = view.config as unknown as ViewConfig

    return cfg?.columns ? cfg : DEFAULT_VIEW_CONFIG
}

export function useProductTable(view: TableView) {
    const groupId = view.group
    const currentUser = useAuthenticationStore(state => state.user)
    const [products, setProducts] = useState<ProductRow[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [viewConfig, setViewConfig] = useState<ViewConfig>(() => configFromView(view))
    const [refreshKey, setRefreshKey] = useState(0)
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Reset when switching views
    useEffect(() => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        const cfg = configFromView(view)
        setViewConfig(cfg)
        setSearch('')
        setDebouncedSearch('')
    }, [view.id])

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300)

        return () => clearTimeout(timer)
    }, [search])

    // Append group member columns if not already present
    useEffect(() => {
        if (!currentUser) {
            return
        }

        getGroupMembers(groupId).then(members => {
            const others = members.filter(m => m.user_id !== currentUser.id)
            setViewConfig(prev => {
                const existingIds = new Set(prev.columns.map(c => c.id))
                const newCols: ColumnConfig[] = []
                for (const m of others) {
                    const ratingId = `rating_${m.user_id}` as ColumnId
                    const commentId = `comment_${m.user_id}` as ColumnId
                    const name = `${m.first_name} ${m.last_name}`.trim() || m.username
                    if (!existingIds.has(ratingId)) {
                        newCols.push({id: ratingId, visible: true, label: name, userId: m.user_id})
                    }
                    if (!existingIds.has(commentId)) {
                        newCols.push({id: commentId, visible: true, label: name, userId: m.user_id})
                    }
                }

                if (newCols.length === 0) {
                    return prev
                }

                return {...prev, columns: [...prev.columns, ...newCols]}
            })
        })
    }, [view.id, groupId, currentUser])

    // Fetch products on search / sorting / filters change
    useEffect(() => {
        setLoading(true)
        const params: Record<string, string | number | boolean | undefined> = {
            group_id: groupId,
            limit: 100,
            offset: 0,
        }
        if (debouncedSearch) {
            params.search = debouncedSearch
        }

        const ordering = viewConfig.sorting
            .map(s => (s.direction === 'desc' ? `-${s.field}` : s.field))
            .join(',')
        if (ordering) {
            params.ordering = ordering
        }

        for (const filter of viewConfig.filters) {
            if (!filter.value) {
                continue
            } else if (filter.operator === 'eq' || filter.operator === 'contains') {
                params[filter.field] = filter.value
            }
        }

        getProducts(params)
            .then(data => {
                setProducts(data.results)
                setTotal(data.count)
            })
            .finally(() => setLoading(false))
    }, [groupId, debouncedSearch, viewConfig.sorting, viewConfig.filters, refreshKey])

    const updateConfig = useCallback((updater: (prev: ViewConfig) => ViewConfig) => {
        setViewConfig(prev => {
            const next = updater(prev)
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
            saveTimerRef.current = setTimeout(() => {
                void updateTableView(view.id, {config: next as unknown as TableViewConfig})
            }, 600)
            return next
        })
    }, [view.id])

    const refresh = useCallback(() => setRefreshKey(k => k + 1), [])

    useEffect(() => {
        window.addEventListener('productCreated', refresh)
        return () => window.removeEventListener('productCreated', refresh)
    }, [refresh])

    return {
        products,
        total,
        loading,
        search,
        setSearch,
        viewConfig,
        updateConfig,
        refresh,
    }
}
