import {useState, useEffect} from 'react'
import {Typography} from '@mui/material'
import {getCategories, createCategory} from '@/app/api/categories'
import {SearchableSelect} from '@/shared/ui/SearchableSelect'
import type {SelectOption} from '@/shared/ui/SearchableSelect'
import styles from './CategoryStep.module.scss'

interface Props {
    onSelect: (option: SelectOption) => void
}

export function CategoryStep({onSelect}: Props) {
    const [categories, setCategories] = useState<SelectOption[]>([])

    useEffect(() => {
        getCategories().then(data =>
            setCategories(data.map(c => ({id: c.id, label: c.name})))
        )
    }, [])

    const handleCreate = async (name: string): Promise<SelectOption> => {
        const created = await createCategory(name)
        return {id: created.id, label: created.name}
    }

    return (
        <div className={styles.container}>
            <Typography variant='body2' color='text.secondary' className={styles.label}>
                Choose category
            </Typography>
            <SearchableSelect
                options={categories}
                onSelect={onSelect}
                onCreate={handleCreate}
                placeholder='Search categories...'
                fullHeight
            />
        </div>
    )
}
