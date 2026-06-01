import {useSortable} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'
import styles from './SortableTab.module.scss'

interface Props {
    id: number
    label: string
    active: boolean
    onSelect: () => void
}

export function SortableTab({id, label, active, onSelect}: Props) {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id})
    return (
        <button
            ref={setNodeRef}
            onClick={onSelect}
            className={[styles.tab, active && styles.tabActive, isDragging && styles.tabDragging].filter(Boolean).join(' ')}
            style={{transform: CSS.Transform.toString(transform), transition, touchAction: 'none'}}
            {...attributes}
            {...listeners}
        >
            {label}
        </button>
    )
}
