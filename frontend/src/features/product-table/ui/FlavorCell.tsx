import {useState} from 'react'
import {Popover} from '@mui/material'
import styles from './FlavorCell.module.scss'

interface Props {
    flavors: string[]
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
                    <span key={f} className={styles.chip}>
                        {f}
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
                        <span key={f} className={styles.chip}>
                            {f}
                        </span>
                    ))}
                </div>
            </Popover>
        </>
    )
}
