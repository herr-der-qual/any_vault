import {
    Drawer, List, ListItem, IconButton, Typography, Divider,
    Select, MenuItem, Button,
} from '@mui/material'
import {
    Close as CloseIcon,
    DragHandle as DragHandleIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
} from '@mui/icons-material'
import {
    DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'
import type {SortConfig} from '../model/types'
import styles from './SortSettingsPanel.module.scss'

interface SortField {
    value: string
    label: string
}

interface Props {
    open: boolean
    sorting: SortConfig[]
    fields: SortField[]
    onClose: () => void
    onChange: (sorting: SortConfig[]) => void
}

function SortableRow({
    rule, index, fields, onChangeField, onChangeDirection, onDelete,
}: {
    rule: SortConfig
    index: number
    fields: SortField[]
    onChangeField: (v: string) => void
    onChangeDirection: (v: 'asc' | 'desc') => void
    onDelete: () => void
}) {
    const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id: index.toString()})
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
            <Select
                size='small'
                value={rule.field}
                onChange={e => onChangeField(e.target.value)}
                className={styles.fieldSelect}
            >
                {fields.map(f => (
                    <MenuItem
                        key={f.value}
                        value={f.value}
                    >
                        {f.label}
                    </MenuItem>
                ))}
            </Select>
            <Select
                size='small'
                value={rule.direction}
                onChange={e => onChangeDirection(e.target.value as 'asc' | 'desc')}
            >
                <MenuItem value='asc'>
                    ↑ Asc
                </MenuItem>
                <MenuItem value='desc'>
                    ↓ Desc
                </MenuItem>
            </Select>
            <IconButton
                size='small'
                onClick={onDelete}
            >
                <DeleteIcon fontSize='small'/>
            </IconButton>
        </ListItem>
    )
}

export function SortSettingsPanel({open, sorting, fields, onClose, onChange}: Props) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(TouchSensor, {activationConstraint: {delay: 250, tolerance: 5}}),
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event
        if (!over || active.id === over.id) {
            return
        }

        const from = Number(active.id)
        const to = Number(over.id)
        onChange(arrayMove(sorting, from, to))
    }

    const update = (index: number, patch: Partial<SortConfig>) => {
        onChange(sorting.map((r, i) => i === index ? {...r, ...patch} : r))
    }

    const addRule = () => {
        const used = new Set(sorting.map(r => r.field))
        const next = fields.find(f => !used.has(f.value))
        if (!next) {
            return
        }

        onChange([...sorting, {field: next.value, direction: 'asc'}])
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
                        Sort
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
                        items={sorting.map((_, i) => i.toString())}
                        strategy={verticalListSortingStrategy}
                    >
                        <List dense>
                            {sorting.map((rule, i) => (
                                <SortableRow
                                    key={i}
                                    rule={rule}
                                    index={i}
                                    fields={fields}
                                    onChangeField={v => update(i, {field: v})}
                                    onChangeDirection={v => update(i, {direction: v})}
                                    onDelete={() => onChange(sorting.filter((_, j) => j !== i))}
                                />
                            ))}
                        </List>
                    </SortableContext>
                </DndContext>
                <div className={styles.addRow}>
                    <Button
                        startIcon={<AddIcon/>}
                        size='small'
                        onClick={addRule}
                        disabled={sorting.length >= fields.length}
                    >
                        Add sort rule
                    </Button>
                </div>
            </div>
        </Drawer>
    )
}
