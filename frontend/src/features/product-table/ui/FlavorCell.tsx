import {useState} from 'react'
import type React from 'react'
import {Popover} from '@mui/material'
import type {Color} from '@/app/api/colors'
import styles from './FlavorCell.module.scss'

interface Flavor {
    name: string
    color: Color | null
}

interface Props {
    flavors: Flavor[]
    noSugar?: boolean
}

function chipStyle(color: Color | null): React.CSSProperties | undefined {
    if (!color) return undefined
    return {backgroundColor: color.primary, color: color.secondary}
}

export function FlavorCell({flavors, noSugar}: Props) {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null)

    if (!noSugar && flavors.length === 0) {
        return <span className={styles.empty}>—</span>
    }

    const visible = flavors.slice(0, 3)
    const hasMore = flavors.length > 3

    return (
        <>
            <div
                className={styles.grid}
                onClick={e => hasMore && setAnchor(e.currentTarget)}
                style={{cursor: hasMore ? 'pointer' : 'default'}}
            >
                {noSugar && (
                    <span className={styles.chip}>No sugar</span>
                )}
                {visible.map(f => (
                    <span key={f.name} className={styles.chip} style={chipStyle(f.color)}>
                        {f.name}
                    </span>
                ))}
                {hasMore &&
                    <span className={styles.more}>
                        +{flavors.length - 3}
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
                    {noSugar && (
                        <span className={styles.chip}>No sugar</span>
                    )}
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
