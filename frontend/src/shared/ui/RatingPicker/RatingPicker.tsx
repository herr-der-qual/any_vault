import styles from './RatingPicker.module.scss'

interface Props {
    value: number | null
    onChange: (v: number | null) => void
}

export function RatingPicker({value, onChange}: Props) {
    return (
        <div className={styles.buttons}>
            {Array.from({length: 10}, (_, i) => i + 1).map(n => (
                <button
                    key={n}
                    type='button'
                    className={`${styles.btn} ${value === n ? styles.selected : ''}`}
                    onClick={() => onChange(value === n ? null : n)}
                >
                    {n}
                </button>
            ))}
        </div>
    )
}
