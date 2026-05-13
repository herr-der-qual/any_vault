import {Button, Typography} from '@mui/material'
import styles from './RateStep.module.scss'

interface Props {
    name: string
    value: number | null
    onChange: (value: number) => void
    onNext: () => void
}

export function RateStep({name, value, onChange, onNext}: Props) {
    return (
        <div className={styles.container}>
            <Typography variant='body2' color='text.secondary' className={styles.label}>
                Rate — {name}
            </Typography>
            <div className={styles.buttons}>
                {Array.from({length: 10}, (_, i) => i + 1).map(n => (
                    <button
                        key={n}
                        type='button'
                        className={`${styles.rateButton} ${value === n ? styles.selected : ''}`}
                        onClick={() => onChange(n)}
                    >
                        {n}
                    </button>
                ))}
            </div>
            <Button
                variant='contained'
                onClick={onNext}
                sx={{mt: 2}}
            >
                Next
            </Button>
        </div>
    )
}
