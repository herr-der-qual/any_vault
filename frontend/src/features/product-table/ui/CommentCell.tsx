import {useState} from 'react'
import {Popover} from '@mui/material'
import styles from './CommentCell.module.scss'

interface Props {
    text: string
}

export function CommentCell({text}: Props) {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null)

    if (!text) {
        return <span className={styles.empty}>—</span>
    }

    const truncated = text.length > 20 ? `${text.slice(0, 20)}...` : text
    const hasMore = text.length > 20

    return (
        <>
            <span
                className={styles.text}
                style={{cursor: hasMore ? 'pointer' : 'default'}}
                onClick={e => hasMore && setAnchor(e.currentTarget)}
            >
                {truncated}
            </span>
            {hasMore && (
                <Popover
                    open={Boolean(anchor)}
                    anchorEl={anchor}
                    onClose={() => setAnchor(null)}
                    anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
                >
                    <div className={styles.popover}>{text}</div>
                </Popover>
            )}
        </>
    )
}
