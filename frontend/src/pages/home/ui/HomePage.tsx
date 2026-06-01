import {useState, useEffect} from 'react'
import {
    IconButton, Typography,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material'
import {Add as AddIcon} from '@mui/icons-material'
import {
    DndContext, PointerSensor, useSensor, useSensors, closestCenter,
    type DragEndEvent,
} from '@dnd-kit/core'
import {SortableContext, horizontalListSortingStrategy, arrayMove} from '@dnd-kit/sortable'
import {TipButton} from '@/shared/ui/TipButton'
import {SortableTab} from '@/shared/ui/SortableTab'
import {getMyGroups} from '@/app/api/groups'
import {getTableViews, createTableView, deleteTableView, reorderTableViews} from '@/app/api/tableViews'
import type {TableView, TableViewConfig} from '@/app/api/tableViews'
import type {Group} from '@/entities/group'
import {ProductTable, DEFAULT_VIEW_CONFIG} from '@/features/product-table'
import styles from './HomePage.module.scss'


export function HomePage() {
    const [views, setViews] = useState<TableView[]>([])
    const [groups, setGroups] = useState<Group[]>([])
    const [activeViewId, setActiveViewId] = useState<number | null>(null)
    const [createOpen, setCreateOpen] = useState(false)
    const [newName, setNewName] = useState('')
    const [newGroupId, setNewGroupId] = useState<number | ''>('')

    useEffect(() => {
        Promise.all([getTableViews(), getMyGroups()]).then(([v, g]) => {
            setViews(v)
            setGroups(g)
            setActiveViewId(v[0]?.id ?? null)
            setNewGroupId(g[0]?.id ?? '')
        })
    }, [])

    const handleCreate = async () => {
        if (!newName.trim() || newGroupId === '') return
        const view = await createTableView({
            name: newName.trim(),
            group: newGroupId as number,
            config: DEFAULT_VIEW_CONFIG as unknown as TableViewConfig,
        })
        setViews(prev => [...prev, view])
        setActiveViewId(view.id)
        setCreateOpen(false)
        setNewName('')
    }

    const handleDelete = async (id: number) => {
        await deleteTableView(id)
        setViews(prev => {
            const next = prev.filter(v => v.id !== id)
            if (activeViewId === id) {
                setActiveViewId(next[0]?.id ?? null)
            }

            return next
        })
    }

    const handleViewUpdated = (updated: TableView) => {
        setViews(prev => prev.map(v => v.id === updated.id ? updated : v))
    }

    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 5}}),
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event
        if (!over || active.id === over.id) return
        const oldIndex = views.findIndex(v => v.id === active.id)
        const newIndex = views.findIndex(v => v.id === over.id)
        const reordered = arrayMove(views, oldIndex, newIndex)
        setViews(reordered)
        void reorderTableViews(reordered.map(v => v.id))
    }

    const activeView = views.find(v => v.id === activeViewId) ?? null

    return (
        <div className={styles.page}>
            <div className={styles.tabBar}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={views.map(v => v.id)} strategy={horizontalListSortingStrategy}>
                        <div className={styles.tabList}>
                            {views.map(v => (
                                <SortableTab
                                    key={v.id}
                                    id={v.id}
                                    label={v.name}
                                    active={v.id === activeViewId}
                                    onSelect={() => setActiveViewId(v.id)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
                <IconButton
                    size='small'
                    onClick={() => setCreateOpen(true)}
                    title='Create view'
                    className={styles.createButton}
                >
                    <AddIcon/>
                </IconButton>
            </div>

            <div className={styles.tableArea}>
                {activeView ? (
                    <ProductTable
                        view={activeView}
                        groups={groups}
                        onViewUpdated={handleViewUpdated}
                        onViewDeleted={handleDelete}
                    />
                ) : (
                    <div className={styles.emptyState}>
                        <Typography color='text.secondary'>
                            No views yet
                        </Typography>
                        <Button
                            variant='contained'
                            startIcon={<AddIcon/>}
                            onClick={() => setCreateOpen(true)}
                        >
                            Create view
                        </Button>
                    </div>
                )}
            </div>

            <Dialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                maxWidth='xs'
                fullWidth
            >
                <DialogTitle className={styles.dialogTitle}>
                    Create view
                    <TipButton
                        title='What is a view?'
                        description='A view is a saved table configuration — which columns are shown, how rows are sorted, and which filters are active. Give it a name you can recognize (e.g. "Energy drinks", "By rating"). Each view belongs to a group and is visible to all its members.'
                    />
                </DialogTitle>
                <DialogContent className={styles.dialogContent}>
                    <TextField
                        autoFocus
                        label='Name'
                        size='small'
                        fullWidth
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreate()}
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
                            value={newGroupId}
                            onChange={e => setNewGroupId(e.target.value as number)}
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
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant='contained'
                        onClick={handleCreate}
                        disabled={!newName.trim() || newGroupId === ''}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}
