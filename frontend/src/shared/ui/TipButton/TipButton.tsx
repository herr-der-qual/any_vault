import {useState} from 'react'
import {IconButton, Popover, Typography} from '@mui/material'
import {InfoOutlined as InfoIcon} from '@mui/icons-material'
import styles from './TipButton.module.scss'

interface Props {
    title: string
    description: string
}

export function TipButton({title, description}: Props) {
    const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null)

    return (
        <>
            <IconButton
                size='small'
                className={styles.button}
                onClick={e => setAnchor(e.currentTarget)}
            >
                <InfoIcon fontSize='small'/>
            </IconButton>
            <Popover
                open={Boolean(anchor)}
                anchorEl={anchor}
                onClose={() => setAnchor(null)}
                anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
                transformOrigin={{vertical: 'top', horizontal: 'left'}}
            >
                <div className={styles.popover}>
                    <Typography
                        variant='subtitle2'
                        className={styles.title}
                    >
                        {title}
                    </Typography>
                    <Typography
                        variant='body2'
                        color='text.secondary'
                    >
                        {description}
                    </Typography>
                </div>
            </Popover>
        </>
    )
}
