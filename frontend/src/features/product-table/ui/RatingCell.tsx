import styles from './RatingCell.module.scss'

interface Props {
    value: number | null | undefined
}

export function RatingCell({value}: Props) {
    if (value == null) return <span className={styles.empty}>—</span>
    return <span className={styles.badge}>{value}</span>
}
