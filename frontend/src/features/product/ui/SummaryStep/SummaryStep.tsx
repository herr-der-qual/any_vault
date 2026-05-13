import {Button, Typography} from '@mui/material'
import styles from './SummaryStep.module.scss'

interface RaterSummary {
    name: string
    rating: number | null
    comment: string
}

interface Props {
    category: string
    brand: string
    variant: string
    flavors: string[]
    raters: RaterSummary[]
    onSubmit: () => void
}

export function SummaryStep({category, brand, variant, flavors, raters, onSubmit}: Props) {
    return (
        <div className={styles.container}>
            <Typography variant='body2' color='text.secondary' className={styles.label}>
                Summary
            </Typography>
            <div className={styles.cards}>
                {raters.map((rater, i) => (
                    <div key={i} className={styles.card}>
                        <Typography variant='subtitle2' className={styles.raterName}>{rater.name}</Typography>
                        <div className={styles.row}>
                            <Typography variant='caption' color='text.secondary'>Category</Typography>
                            <Typography variant='body2'>{category || '—'}</Typography>
                        </div>
                        <div className={styles.row}>
                            <Typography variant='caption' color='text.secondary'>Brand</Typography>
                            <Typography variant='body2'>{brand || '—'}</Typography>
                        </div>
                        {variant && (
                            <div className={styles.row}>
                                <Typography variant='caption' color='text.secondary'>Variant</Typography>
                                <Typography variant='body2'>{variant}</Typography>
                            </div>
                        )}
                        {flavors.length > 0 && (
                            <div className={styles.row}>
                                <Typography variant='caption' color='text.secondary'>Flavors</Typography>
                                <Typography variant='body2'>{flavors.join(', ')}</Typography>
                            </div>
                        )}
                        <div className={styles.row}>
                            <Typography variant='caption' color='text.secondary'>Rate</Typography>
                            <Typography variant='body2'>{rater.rating ?? '—'}</Typography>
                        </div>
                        <div className={styles.row}>
                            <Typography variant='caption' color='text.secondary'>Comment</Typography>
                            <Typography variant='body2'>{rater.comment || '—'}</Typography>
                        </div>
                    </div>
                ))}
            </div>
            <Button variant='contained' onClick={onSubmit} sx={{mt: 2}}>
                Submit
            </Button>
        </div>
    )
}
