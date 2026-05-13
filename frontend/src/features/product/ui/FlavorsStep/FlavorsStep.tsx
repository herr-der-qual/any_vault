import {useState, useEffect} from 'react'
import {Button, Typography} from '@mui/material'
import {getFlavors, createFlavor} from '@/app/api/flavors'
import {SearchableMultiSelect} from '@/shared/ui/SearchableMultiSelect'
import type {SelectOption} from '@/shared/ui/SearchableSelect'
import styles from './FlavorsStep.module.scss'

interface Props {
    selected: SelectOption[]
    onChange: (selected: SelectOption[]) => void
    onNext: () => void
}

export function FlavorsStep({selected, onChange, onNext}: Props) {
    const [flavors, setFlavors] = useState<SelectOption[]>([])

    useEffect(() => {
        getFlavors().then(data =>
            setFlavors(data.map(f => ({id: f.id, label: f.name})))
        )
    }, [])

    const handleCreate = async (name: string): Promise<SelectOption> => {
        const created = await createFlavor(name)
        return {id: created.id, label: created.name}
    }

    return (
        <div className={styles.container}>
            <Typography variant='body2' color='text.secondary' className={styles.label}>
                Choose flavors
            </Typography>
            <SearchableMultiSelect
                options={flavors}
                selected={selected}
                onChange={onChange}
                onCreate={handleCreate}
                placeholder='Search flavors...'
                fullHeight
            />
            <Button variant='contained' onClick={onNext} className={styles.button}>
                Next
            </Button>
        </div>
    )
}
