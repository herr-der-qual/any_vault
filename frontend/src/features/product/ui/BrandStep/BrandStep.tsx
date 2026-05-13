import {useState, useEffect} from 'react'
import {Typography} from '@mui/material'
import {getBrands, createBrand} from '@/app/api/brands'
import {SearchableSelect} from '@/shared/ui/SearchableSelect'
import type {SelectOption} from '@/shared/ui/SearchableSelect'
import styles from './BrandStep.module.scss'

interface Props {
    onSelect: (option: SelectOption) => void
}

export function BrandStep({onSelect}: Props) {
    const [brands, setBrands] = useState<SelectOption[]>([])

    useEffect(() => {
        getBrands().then(data =>
            setBrands(data.map(b => ({id: b.id, label: b.name})))
        )
    }, [])

    const handleCreate = async (name: string): Promise<SelectOption> => {
        const created = await createBrand(name)
        return {id: created.id, label: created.name}
    }

    return (
        <div className={styles.container}>
            <Typography variant='body2' color='text.secondary' className={styles.label}>
                Choose brand
            </Typography>
            <SearchableSelect
                options={brands}
                onSelect={onSelect}
                onCreate={handleCreate}
                placeholder='Search brands...'
                fullHeight
            />
        </div>
    )
}
