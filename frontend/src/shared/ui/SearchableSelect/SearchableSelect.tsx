import {useState} from 'react'
import {CircularProgress, TextField, Typography} from '@mui/material'
import {AddOutlined} from '@mui/icons-material'
import styles from './SearchableSelect.module.scss'

export interface SelectOption {
    id: number
    label: string
}

interface Props {
    options: SelectOption[]
    onSelect: (option: SelectOption) => void
    onCreate?: (label: string) => Promise<SelectOption>
    placeholder?: string
    fullHeight?: boolean
}

export function SearchableSelect({options, onSelect, onCreate, placeholder = 'Search...', fullHeight}: Props) {
    const [search, setSearch] = useState('')
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState('')

    const filtered = options.filter(option =>
        option.label.toLowerCase().includes(search.toLowerCase())
    )

    const exactMatch = options.some(option =>
        option.label.toLowerCase() === search.toLowerCase()
    )

    const handleCreate = async () => {
        if (!onCreate || !search.trim() || creating) return
        setCreating(true)
        setCreateError('')
        try {
            const created = await onCreate(search.trim())
            onSelect(created)
        } catch {
            setCreateError(`Failed to add "${search.trim()}"`)
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className={`${styles.container} ${fullHeight ? styles.containerFullHeight : ''}`}>
            <TextField
                fullWidth
                size='small'
                placeholder={placeholder}
                value={search}
                onChange={event => setSearch(event.target.value)}
                autoFocus
            />
            <div className={`${styles.list} ${fullHeight ? styles.listFullHeight : ''}`}>
                {filtered.map(option => (
                    <button
                        key={option.id}
                        type='button'
                        className={styles.item}
                        onClick={() => onSelect(option)}
                    >
                        <Typography variant='body2'>{option.label}</Typography>
                    </button>
                ))}
                {onCreate && search.trim() && !exactMatch && (
                    <button
                        type='button'
                        className={styles.addItem}
                        onClick={handleCreate}
                        disabled={creating}
                    >
                        {creating
                            ? <CircularProgress size={16} color='inherit'/>
                            : <AddOutlined fontSize='small'/>
                        }
                        <Typography variant='body2'>Add "{search.trim()}"</Typography>
                    </button>
                )}
                {createError && (
                    <Typography variant='caption' className={styles.error}>{createError}</Typography>
                )}
            </div>
        </div>
    )
}
