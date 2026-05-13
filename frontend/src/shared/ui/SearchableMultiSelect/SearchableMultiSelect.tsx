import {useState} from 'react'
import {CircularProgress, IconButton, InputAdornment, TextField, Typography} from '@mui/material'
import {AddOutlined, CheckOutlined, ClearOutlined} from '@mui/icons-material'
import type {SelectOption} from '@/shared/ui/SearchableSelect'
import styles from './SearchableMultiSelect.module.scss'

interface Props {
    options: SelectOption[]
    selected: SelectOption[]
    onChange: (selected: SelectOption[]) => void
    onCreate?: (label: string) => Promise<SelectOption>
    placeholder?: string
    fullHeight?: boolean
}

export function SearchableMultiSelect({options, selected, onChange, onCreate, placeholder = 'Search...', fullHeight}: Props) {
    const [search, setSearch] = useState('')
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState('')
    const [localOptions, setLocalOptions] = useState<SelectOption[]>([])

    const allOptions = [...options, ...localOptions]

    const filtered = allOptions.filter(option =>
        option.label.toLowerCase().includes(search.toLowerCase())
    )

    const exactMatch = allOptions.some(option =>
        option.label.toLowerCase() === search.toLowerCase()
    )

    const isSelected = (id: number) => selected.some(s => s.id === id)

    const handleToggle = (option: SelectOption) => {
        if (isSelected(option.id)) {
            onChange(selected.filter(s => s.id !== option.id))
        } else {
            onChange([...selected, option])
        }
    }

    const handleCreate = async () => {
        if (!onCreate || !search.trim() || creating) return
        setCreating(true)
        setCreateError('')
        try {
            const created = await onCreate(search.trim())
            setLocalOptions(prev => [...prev, created])
            onChange([...selected, created])
            setSearch('')
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
                slotProps={{input: {endAdornment: search && (
                    <InputAdornment position='end'>
                        <IconButton size='small' onClick={() => setSearch('')}>
                            <ClearOutlined fontSize='small'/>
                        </IconButton>
                    </InputAdornment>
                )}}}
            />
            <div className={`${styles.list} ${fullHeight ? styles.listFullHeight : ''}`}>
                {filtered.map(option => (
                    <button
                        key={option.id}
                        type='button'
                        className={`${styles.item} ${isSelected(option.id) ? styles.itemSelected : ''}`}
                        onClick={() => handleToggle(option)}
                    >
                        <Typography variant='body2' className={styles.itemLabel}>{option.label}</Typography>
                        {isSelected(option.id) && <CheckOutlined fontSize='small' className={styles.check}/>}
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
