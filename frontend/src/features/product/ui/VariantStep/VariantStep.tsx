import {Button, TextField, Typography} from '@mui/material'
import styles from './VariantStep.module.scss'

interface Props {
    value: string
    onChange: (value: string) => void
    onNext: () => void
}

export function VariantStep({value, onChange, onNext}: Props) {
    return (
        <div className={styles.container}>
            <Typography variant='body2' color='text.secondary' className={styles.label}>
                Variant
            </Typography>
            <TextField
                autoFocus
                fullWidth
                value={value}
                onChange={event => onChange(event.target.value)}
                onKeyDown={event => { if (event.key === 'Enter') onNext() }}
            />
            <Button variant='contained' onClick={onNext} className={styles.button}>
                Next
            </Button>
        </div>
    )
}
