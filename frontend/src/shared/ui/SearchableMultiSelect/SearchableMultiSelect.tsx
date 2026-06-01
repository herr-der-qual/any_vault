import {useState, useRef, useEffect} from 'react'
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
    const [focusedIndex, setFocusedIndex] = useState(-1)
    const listRef = useRef<HTMLDivElement>(null)

    const allOptions = [...options, ...localOptions]

    const filtered = allOptions.filter(option =>
        option.label.toLowerCase().includes(search.toLowerCase())
    )

    const exactMatch = allOptions.some(option =>
        option.label.toLowerCase() === search.toLowerCase()
    )

    const showCreate = Boolean(onCreate && search.trim() && !exactMatch)
    const totalItems = filtered.length + (showCreate ? 1 : 0)

    const isSelected = (id: number) => selected.some(s => s.id === id)

    const handleToggle = (option: SelectOption) => {
        if (isSelected(option.id)) {
            onChange(selected.filter(s => s.id !== option.id))
        } else {
            onChange([...selected, option])
        }
    }

    useEffect(() => { setFocusedIndex(-1) }, [search])

    useEffect(() => {
        if (focusedIndex < 0 || !listRef.current) return
        listRef.current.querySelectorAll<HTMLElement>('[data-idx]')[focusedIndex]?.scrollIntoView({block: 'nearest'})
    }, [focusedIndex])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (totalItems === 0) return
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setFocusedIndex(i => (i + 1) % totalItems)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setFocusedIndex(i => (i <= 0 ? totalItems - 1 : i - 1))
        } else if (e.key === 'Enter' && focusedIndex >= 0) {
            e.preventDefault()
            if (focusedIndex < filtered.length) {
                handleToggle(filtered[focusedIndex])
            } else if (showCreate) {
                void handleCreate()
            }
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
                onKeyDown={handleKeyDown}
                autoFocus
                slotProps={{input: {endAdornment: search && (
                    <InputAdornment position='end'>
                        <IconButton size='small' onClick={() => setSearch('')}>
                            <ClearOutlined fontSize='small'/>
                        </IconButton>
                    </InputAdornment>
                )}}}
            />
            <div ref={listRef} className={`${styles.list} ${fullHeight ? styles.listFullHeight : ''}`}>
                {filtered.map((option, i) => (
                    <button
                        key={option.id}
                        data-idx={i}
                        type='button'
                        className={[
                            styles.item,
                            isSelected(option.id) ? styles.itemSelected : '',
                            focusedIndex === i ? styles.itemFocused : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => handleToggle(option)}
                    >
                        <Typography variant='body2' className={styles.itemLabel}>{option.label}</Typography>
                        {isSelected(option.id) && <CheckOutlined fontSize='small' className={styles.check}/>}
                    </button>
                ))}
                {showCreate && (
                    <button
                        data-idx={filtered.length}
                        type='button'
                        className={[styles.addItem, focusedIndex === filtered.length ? styles.addItemFocused : ''].filter(Boolean).join(' ')}
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
