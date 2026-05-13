import {Button, TextField, Typography} from '@mui/material'
import styles from './CommentStep.module.scss'

interface Props {
    name: string
    value: string
    onChange: (value: string) => void
    onNext: () => void
}

export function CommentStep({name, value, onChange, onNext}: Props) {
    return (
        <div className={styles.container}>
            <Typography variant='body2' color='text.secondary' className={styles.label}>
                Comment — {name}
            </Typography>
            <TextField
                autoFocus
                fullWidth
                multiline
                rows={4}
                value={value}
                onChange={event => onChange(event.target.value)}
            />
            <Button variant='contained' onClick={onNext} sx={{mt: 2}}>
                Next
            </Button>
        </div>
    )
}
