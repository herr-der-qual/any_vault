import {useState} from 'react'
import type React from 'react'
import {Popover} from '@mui/material'
import {COLORS} from '@/shared/ui/ColoredMultiSelect'
import styles from './FlavorCell.module.scss'

interface Flavor {
    name: string
    color: string | null
}

interface Props {
    flavors: Flavor[]
}

function chipStyle(color: string | null): React.CSSProperties | undefined {
    if (!color) return undefined
    const text = COLORS.find(c => c.value === color)?.text ?? '#000'
    return {backgroundColor: color, color: text}
}

export function FlavorCell({flavors}: Props) {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null)

    if (flavors.length === 0) {
        return <span className={styles.empty}>—</span>
    }

    const visible = flavors.slice(0, 6)
    const hasMore = flavors.length > 6

    return (
        <>
            <div
                className={styles.grid}
                onClick={e => hasMore && setAnchor(e.currentTarget)}
                style={{cursor: hasMore ? 'pointer' : 'default'}}
            >
                {visible.map(f => (
                    <span key={f.name} className={styles.chip} style={chipStyle(f.color)}>
                        {f.name}
                    </span>
                ))}
                {hasMore &&
                    <span className={styles.more}>
                        +{flavors.length - 6}
                    </span>
                }
            </div>
            <Popover
                open={Boolean(anchor)}
                anchorEl={anchor}
                onClose={() => setAnchor(null)}
                anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
            >
                <div className={styles.popover}>
                    {flavors.map(f => (
                        <span key={f.name} className={styles.chip} style={chipStyle(f.color)}>
                            {f.name}
                        </span>
                    ))}
                </div>
            </Popover>
        </>
    )
}
