import {IconButton, Typography} from '@mui/material'
import {ArrowBackOutlined} from '@mui/icons-material'
import styles from './NavBar.module.scss'

interface Props {
    title: string
    onBack: () => void
}

export function NavBar({title, onBack}: Props) {
    return (
        <div className={styles.navBar}>
            <IconButton edge='start' onClick={onBack}>
                <ArrowBackOutlined/>
            </IconButton>
            <Typography variant='h6' className={styles.title}>{title}</Typography>
        </div>
    )
}
