import {useState, useEffect} from 'react'
import {Button, Typography} from '@mui/material'
import {getMyGroups} from '@/app/api/groups'
import type {Group} from '@/entities/group'
import styles from './GroupStep.module.scss'

interface Props {
    onSelect: (groupId: number | null) => void
}

export function GroupStep({onSelect}: Props) {
    const [groups, setGroups] = useState<Group[]>([])

    useEffect(() => {
        getMyGroups().then(setGroups)
    }, [])

    return (
        <div className={styles.container}>
            <Typography variant='body2' color='text.secondary' className={styles.label}>
                Choose group
            </Typography>
            <div className={styles.list}>
                {groups.map(group => (
                    <button
                        key={group.id}
                        type='button'
                        className={styles.item}
                        onClick={() => onSelect(group.id)}
                    >
                        <Typography variant='body2'>{group.name}</Typography>
                    </button>
                ))}
            </div>
            <Button variant='text' onClick={() => onSelect(null)} className={styles.skip}>
                Skip
            </Button>
        </div>
    )
}
