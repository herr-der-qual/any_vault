import {Button, TextField, Typography} from '@mui/material'
import {TipButton} from '@/shared/ui/TipButton'
import styles from './VariantStep.module.scss'

interface Props {
    value: string
    onChange: (value: string) => void
    onNext: () => void
}

const TIP = 'Variant is the specific version or flavour of a product. ' +
    'For example: Monster Energy → Ultra Paradise, Coca-Cola → Zero, Red Bull → Sugar Free. ' +
    'Leave blank if the product has only one version.'

export function VariantStep({value, onChange, onNext}: Props) {
    return (
        <div className={styles.container}>
            <div className={styles.labelRow}>
                <Typography
                    variant='body2'
                    color='text.secondary'
                >
                    Variant
                </Typography>
                <TipButton
                    title='What is a variant?'
                    description={TIP}
                />
            </div>
            <TextField
                autoFocus
                fullWidth
                value={value}
                onChange={event => onChange(event.target.value)}
                onKeyDown={event => { if (event.key === 'Enter') onNext() }}
            />
            <Button
                variant='contained'
                onClick={onNext}
                className={styles.button}
            >
                Next
            </Button>
        </div>
    )
}
