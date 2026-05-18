import {
    Drawer, List, ListItem, ListItemText, Switch, IconButton, Typography, Divider,
} from '@mui/material'
import {
    Close as CloseIcon,
    DragHandle as DragHandleIcon,
} from '@mui/icons-material'
import {
    DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'
import type {ColumnConfig} from '../model/types'
import styles from './ColumnSettingsPanel.module.scss'

interface Props {
    open: boolean
    columns: ColumnConfig[]
    onClose: () => void
    onChange: (columns: ColumnConfig[]) => void
}

function COLUMN_LABEL(col: ColumnConfig): string {
    switch (col.id) {
        case 'category':
            return 'Category'
        case 'brand_variant':
            return 'Brand'
        case 'flavors':
            return 'Flavors'
        case 'my_rating':
            return 'Me (rating)'
        case 'my_comment':
            return 'Me (comment)'
        default:
            if (col.id.startsWith('rating_')) {
                return `${col.label ?? ''} (rating)`
            } else if (col.id.startsWith('comment_')) {
                return `${col.label ?? ''} (comment)`
            }

            return col.id
    }
}

function SortableRow({col, onToggle}: {col: ColumnConfig; onToggle: () => void}) {
    const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id: col.id})
    const style = {transform: CSS.Transform.toString(transform), transition}

    return (
        <ListItem
            ref={setNodeRef}
            style={style}
            disablePadding
            className={styles.row}
        >
            <IconButton
                size='small'
                {...attributes}
                {...listeners}
                className={styles.dragHandle}
            >
                <DragHandleIcon fontSize='small'/>
            </IconButton>
            <ListItemText primary={COLUMN_LABEL(col)}/>
            <Switch
                checked={col.visible}
                onChange={onToggle}
                size='small'
            />
        </ListItem>
    )
}

export function ColumnSettingsPanel({open, columns, onClose, onChange}: Props) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(TouchSensor, {activationConstraint: {delay: 250, tolerance: 5}}),
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event
        if (!over || active.id === over.id) {
            return
        }

        const from = columns.findIndex(c => c.id === active.id)
        const to = columns.findIndex(c => c.id === over.id)
        onChange(arrayMove(columns, from, to))
    }

    const toggle = (id: string) => {
        onChange(columns.map(c => c.id === id ? {...c, visible: !c.visible} : c))
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
                        Columns
                    </Typography>
                    <IconButton
                        onClick={onClose}
                        size='small'
                    >
                        <CloseIcon/>
                    </IconButton>
                </div>
                <Divider/>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={columns.map(c => c.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <List dense>
                            {columns.map(col => (
                                <SortableRow
                                    key={col.id}
                                    col={col}
                                    onToggle={() => toggle(col.id)}
                                />
                            ))}
                        </List>
                    </SortableContext>
                </DndContext>
            </div>
        </Drawer>
    )
}
