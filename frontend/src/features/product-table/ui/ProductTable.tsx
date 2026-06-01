import {useState, useMemo, useCallback, useRef} from 'react'
import type React from 'react'
import {
    useReactTable, getCoreRowModel, flexRender,
    type ColumnDef,
} from '@tanstack/react-table'
import {
    TextField, IconButton, Skeleton, InputAdornment,
    Drawer, Typography, Divider, Select, MenuItem, FormControl, InputLabel, Button,
} from '@mui/material'
import {
    Search as SearchIcon, ViewColumn as ColumnIcon,
    Sort as SortIcon, FilterList as FilterIcon,
    Settings as SettingsIcon, Clear as ClearIcon,
} from '@mui/icons-material'
import {useAuthenticationStore} from '@/app/store/authenticationStore'
import {updateTableView} from '@/app/api/tableViews'
import type {TableView} from '@/app/api/tableViews'
import type {Group} from '@/entities/group'
import type {ProductRow} from '@/app/api/products'
import type {ColumnConfig} from '../model/types'
import {useProductTable} from '../model/useProductTable'
import {FlavorCell} from './FlavorCell'
import {CommentCell} from './CommentCell'
import {ColumnSettingsPanel} from './ColumnSettingsPanel'
import {SortSettingsPanel} from './SortSettingsPanel'
import {FilterPanel} from './FilterPanel'
import {ProductDialog} from './ProductDialog'
import styles from './ProductTable.module.scss'

interface Props {
    view: TableView
    groups: Group[]
    onViewUpdated: (view: TableView) => void
    onViewDeleted: (id: number) => void
}

function COLUMN_HEADER(col: ColumnConfig): string {
    switch (col.id) {
        case 'category':
            return 'Category'
        case 'brand_variant':
            return 'Brand'
        case 'flavors':
            return 'Flavors'
        case 'my_rating':
        case 'my_comment':
            return 'Me'
        default:
            if (col.id.startsWith('rating_') || col.id.startsWith('comment_')) {
                return col.label ?? ''
            }

            return col.id
    }
}

interface ViewSettingsPanelProps {
    open: boolean
    view: TableView
    groups: Group[]
    onClose: () => void
    onUpdated: (view: TableView) => void
    onDeleted: (id: number) => void
}

function ViewSettingsPanel({open, view, groups, onClose, onUpdated, onDeleted}: ViewSettingsPanelProps) {
    const [name, setName] = useState(view.name)
    const [groupId, setGroupId] = useState(view.group)

    const saveName = async () => {
        const trimmed = name.trim()
        if (!trimmed || trimmed === view.name) return
        const updated = await updateTableView(view.id, {name: trimmed, config: view.config})
        onUpdated({...updated, group: groupId})
    }

    const handleGroupChange = async (newGroupId: number) => {
        setGroupId(newGroupId)
        const updated = await updateTableView(view.id, {name: name.trim() || view.name, config: view.config})
        onUpdated({...updated, group: newGroupId})
    }

    const handleDelete = () => {
        onDeleted(view.id)
        onClose()
    }

    return (
        <Drawer
            anchor='right'
            open={open}
            onClose={onClose}
        >
            <div className={styles.panel}>
                <div className={styles.panelHeader}>
                    <Typography
                        variant='subtitle1'
                        className={styles.panelTitle}
                    >
                        View settings
                    </Typography>
                </div>
                <Divider/>
                <div className={styles.panelBody}>
                    <TextField
                        label='Name'
                        size='small'
                        fullWidth
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onBlur={saveName}
                        onKeyDown={e => { if (e.key === 'Enter') { void saveName() } }}
                    />
                    <FormControl
                        size='small'
                        fullWidth
                    >
                        <InputLabel>
                            Group
                        </InputLabel>
                        <Select
                            label='Group'
                            value={groupId}
                            onChange={e => { void handleGroupChange(Number(e.target.value)) }}
                        >
                            {groups.map(g => (
                                <MenuItem
                                    key={g.id}
                                    value={g.id}
                                >
                                    {g.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        variant='outlined'
                        color='error'
                        onClick={handleDelete}
                    >
                        Delete view
                    </Button>
                </div>
            </div>
        </Drawer>
    )
}

export function ProductTable({view, groups, onViewUpdated, onViewDeleted}: Props) {
    const currentUser = useAuthenticationStore(state => state.user)
    const [showColumns, setShowColumns] = useState(false)
    const [showSort, setShowSort] = useState(false)
    const [showFilter, setShowFilter] = useState(false)
    const [showSettings, setShowSettings] = useState(false)

    const {
        products, loading, search, setSearch,
        viewConfig, updateConfig, refresh,
    } = useProductTable(view)

    const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null)

    const memberNames = useMemo(() => {
        const map: Record<number, string> = {}
        for (const col of viewConfig.columns) {
            if (col.id.startsWith('rating_') && col.userId && col.label) {
                map[col.userId] = col.label
            }
        }
        return map
    }, [viewConfig.columns])

    const canEditOthers = useMemo(() => {
        const role = groups.find(g => g.id === view.group)?.role
        return role === 'admin' || role === 'moderator' || role === 'editor'
    }, [groups, view.group])

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value)
    }, [setSearch])

    const searchInputRef = useRef<HTMLInputElement>(null)

    const handleClearSearch = useCallback(() => {
        setSearch('')
        searchInputRef.current?.focus()
    }, [setSearch])

    const searchSlotProps = useMemo(() => ({
        input: {
            startAdornment: (
                <InputAdornment position='start'>
                    <SearchIcon fontSize='small'/>
                </InputAdornment>
            ),
            endAdornment: (
                <InputAdornment position='end' className={styles.clearAdornment}>
                    <IconButton size='small' onClick={handleClearSearch}>
                        <ClearIcon fontSize='small'/>
                    </IconButton>
                </InputAdornment>
            ),
        },
    }), [handleClearSearch])

    const visibleColumns = viewConfig.columns.filter(c => c.visible)

    const sortFields = useMemo(() => [
        {value: 'category__name', label: 'Category'},
        {value: 'brand__name', label: 'Brand'},
        {value: 'variant', label: 'Variant'},
        {value: 'my_rating', label: 'My rating'},
        ...viewConfig.columns
            .filter(c => c.id.startsWith('rating_'))
            .map(c => ({value: c.id, label: `${c.label ?? ''} rating`})),
    ], [viewConfig.columns])

    const columnDefs = useMemo((): ColumnDef<ProductRow>[] => {
        return visibleColumns.map(col => ({
            id: col.id,
            header: COLUMN_HEADER(col),
            cell: ({row}) => {
                const product = row.original
                if (col.id === 'category') {
                    return product.category ?? '—'
                } else if (col.id === 'brand_variant') {
                    return (
                        <div>
                            <div className={styles.brand}>
                                {product.brand || '—'}
                            </div>
                            {product.variant && (
                                <div className={styles.variant}>
                                    {product.variant}
                                </div>
                            )}
                        </div>
                    )
                } else if (col.id === 'flavors') {
                    return <FlavorCell flavors={product.flavors} noSugar={product.no_sugar}/>
                } else if (col.id === 'my_rating') {
                    const r = product.ratings.find(r => r.user_id === currentUser?.id)

                    return r ? String(r.value) : '—'
                } else if (col.id === 'my_comment') {
                    const c = product.comments.find(c => c.user_id === currentUser?.id)

                    return <CommentCell text={c?.text ?? ''}/>
                } else if (col.id.startsWith('rating_')) {
                    const r = product.ratings.find(r => r.user_id === col.userId)

                    return r ? String(r.value) : '—'
                } else if (col.id.startsWith('comment_')) {
                    const c = product.comments.find(c => c.user_id === col.userId)

                    return <CommentCell text={c?.text ?? ''}/>
                }

                return null
            },
        }))
    }, [visibleColumns, currentUser])

    const table = useReactTable({
        data: products,
        columns: columnDefs,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <div className={styles.wrapper}>
            <div className={styles.toolbar}>
                <TextField
                    size='small'
                    placeholder='Search...'
                    value={search}
                    onChange={handleSearchChange}
                    slotProps={searchSlotProps}
                    inputRef={searchInputRef}
                    className={`${styles.searchField} ${search ? '' : styles.searchFieldEmpty}`}
                />
                <div className={styles.spacer}/>
                <IconButton
                    size='small'
                    onClick={() => setShowFilter(true)}
                    title='Filter'
                    color={viewConfig.filters.length > 0 ? 'primary' : 'default'}
                >
                    <FilterIcon/>
                </IconButton>
                <IconButton
                    size='small'
                    onClick={() => setShowSort(true)}
                    title='Sort'
                    color={viewConfig.sorting.length > 0 ? 'primary' : 'default'}
                >
                    <SortIcon/>
                </IconButton>
                <IconButton
                    size='small'
                    onClick={() => setShowColumns(true)}
                    title='Columns'
                >
                    <ColumnIcon/>
                </IconButton>
                <IconButton
                    size='small'
                    onClick={() => setShowSettings(true)}
                    title='View settings'
                >
                    <SettingsIcon/>
                </IconButton>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        {table.getHeaderGroups().map(hg => (
                            <tr key={hg.id}>
                                {hg.headers.map(header => (
                                    <th
                                        key={header.id}
                                        className={`${styles.th}${header.column.id === 'brand_variant' ? ` ${styles.sticky}` : ''}`}
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {loading
                            ? Array.from({length: 8}).map((_, i) => (
                                <tr key={i}>
                                    {visibleColumns.map(col => (
                                        <td
                                            key={col.id}
                                            className={styles.td}
                                        >
                                            <Skeleton/>
                                        </td>
                                    ))}
                                </tr>
                            ))
                            : table.getRowModel().rows.map(row => (
                                <tr
                                    key={row.id}
                                    className={`${styles.row} ${styles.rowClickable}`}
                                    onClick={() => setEditingProduct(row.original)}
                                >
                                    {row.getVisibleCells().map(cell => (
                                        <td
                                            key={cell.id}
                                            className={`${styles.td}${cell.column.id === 'brand_variant' ? ` ${styles.sticky}` : ''}`}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>

            <ColumnSettingsPanel
                open={showColumns}
                columns={viewConfig.columns}
                onClose={() => setShowColumns(false)}
                onChange={columns => updateConfig(prev => ({...prev, columns}))}
            />
            <SortSettingsPanel
                open={showSort}
                sorting={viewConfig.sorting}
                fields={sortFields}
                onClose={() => setShowSort(false)}
                onChange={sorting => updateConfig(prev => ({...prev, sorting}))}
            />
            <FilterPanel
                open={showFilter}
                filters={viewConfig.filters}
                onClose={() => setShowFilter(false)}
                onChange={filters => updateConfig(prev => ({...prev, filters}))}
            />
            <ViewSettingsPanel
                key={view.id}
                open={showSettings}
                view={view}
                groups={groups}
                onClose={() => setShowSettings(false)}
                onUpdated={onViewUpdated}
                onDeleted={onViewDeleted}
            />
            {editingProduct && (
                <ProductDialog
                    mode='edit'
                    open
                    product={editingProduct}
                    groupId={view.group}
                    memberNames={memberNames}
                    canEditOthers={canEditOthers}
                    onClose={() => setEditingProduct(null)}
                    onSaved={() => { setEditingProduct(null); refresh() }}
                />
            )}
        </div>
    )
}
