import {useState, useRef, useEffect, useMemo} from 'react'
import {Paper, Popper, IconButton} from '@mui/material'
import {MoreHoriz as MoreHorizIcon, Clear as ClearIcon} from '@mui/icons-material'
import styles from './CatalogSelect.module.scss'

interface Props<T extends {id: number; name: string; group_id: number | null}> {
    options: T[]
    value: T | null
    onChange: (value: T | null) => void
    onCreate?: (name: string) => Promise<T>
    canEdit?: (item: T) => boolean
    onEditClick?: (item: T, position: {top: number; left: number}) => void
    keepOpen?: boolean
    label?: string
    required?: boolean
}

export function CatalogSelect<T extends {id: number; name: string; group_id: number | null}>({
    options, value, onChange, onCreate, canEdit, onEditClick, keepOpen, label, required,
}: Props<T>) {
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState(value?.name ?? '')
    const [focusedIndex, setFocusedIndex] = useState(-1)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const keepOpenRef = useRef(keepOpen ?? false)
    const openedWithRef = useRef('')

    useEffect(() => { keepOpenRef.current = keepOpen ?? false }, [keepOpen])
    useEffect(() => { setFocusedIndex(-1) }, [inputValue])
    useEffect(() => { if (!open) setFocusedIndex(-1) }, [open])

    useEffect(() => {
        if (!open) setInputValue(value?.name ?? '')
    }, [value?.name, open])

    useEffect(() => {
        if (focusedIndex < 0 || !dropdownRef.current) return
        dropdownRef.current.querySelectorAll<HTMLElement>('[data-idx]')[focusedIndex]?.scrollIntoView({block: 'nearest'})
    }, [focusedIndex])

    const filtered = useMemo(() => {
        if (!open) return options
        if (inputValue === openedWithRef.current) return options
        const q = inputValue.toLowerCase()
        return q ? options.filter(o => o.name.toLowerCase().includes(q)) : options
    }, [options, inputValue, open])

    const canCreate = Boolean(
        onCreate &&
        inputValue.trim() &&
        inputValue !== openedWithRef.current &&
        !options.some(o => o.name.toLowerCase() === inputValue.trim().toLowerCase())
    )

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            const target = e.target as Node
            if (wrapperRef.current?.contains(target)) return
            if (dropdownRef.current?.contains(target)) return
            if (keepOpenRef.current) return
            setOpen(false)
            setInputValue(value?.name ?? '')
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open, value])

    const openDropdown = () => {
        openedWithRef.current = value?.name ?? ''
        setInputValue(value?.name ?? '')
        setOpen(true)
        inputRef.current?.focus()
        setTimeout(() => inputRef.current?.select(), 0)
    }

    const selectOption = (option: T) => {
        onChange(option)
        setInputValue(option.name)
        setOpen(false)
    }

    const handleCreate = async () => {
        if (!onCreate || !inputValue.trim()) return
        const created = await onCreate(inputValue.trim())
        selectOption(created)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const total = filtered.length + (canCreate ? 1 : 0)
        if (e.key === 'Escape') {
            setOpen(false)
            setInputValue(value?.name ?? '')
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (!open) openDropdown()
            if (total > 0) setFocusedIndex(i => (i + 1) % total)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (total > 0) setFocusedIndex(i => (i <= 0 ? total - 1 : i - 1))
        } else if (e.key === 'Enter') {
            const item = focusedIndex >= 0 && focusedIndex < filtered.length ? filtered[focusedIndex] : undefined
            if (item) { e.preventDefault(); selectOption(item) }
            else if (canCreate) { void handleCreate() }
        } else if (e.key === 'Backspace' && !inputValue && value) {
            onChange(null)
        }
    }

    const floated = open || value !== null || Boolean(inputValue)

    return (
        <div ref={wrapperRef} className={styles.wrapper}>
            <div
                className={`${styles.container}${open ? ` ${styles.containerFocused}` : ''}`}
                onMouseDown={e => {
                    if (e.target === inputRef.current) return
                    e.preventDefault()
                    if (open) {
                        setOpen(false)
                        setInputValue(value?.name ?? '')
                    } else {
                        openDropdown()
                    }
                }}
            >
                {label && (
                    <span className={[
                        styles.label,
                        floated ? styles.labelFloated : '',
                        open ? styles.labelActive : '',
                    ].filter(Boolean).join(' ')}>
                        {label}{required ? ' *' : ''}
                    </span>
                )}
                <div className={styles.inner}>
                    <input
                        ref={inputRef}
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onFocus={() => { if (!open) openDropdown() }}
                        onMouseDown={() => {
                            if (open) {
                                setOpen(false)
                                setInputValue(value?.name ?? '')
                                inputRef.current?.blur()
                            }
                        }}
                        onKeyDown={handleKeyDown}
                        className={styles.input}
                        placeholder={open && !inputValue && value ? value.name : undefined}
                    />
                    {value && !open && (
                        <span
                            className={styles.clearBtn}
                            onMouseDown={e => { e.preventDefault(); onChange(null); setInputValue('') }}
                        >
                            <ClearIcon sx={{fontSize: 16}}/>
                        </span>
                    )}
                </div>
            </div>

            <Popper
                open={open}
                anchorEl={wrapperRef.current}
                placement='bottom-start'
                style={{zIndex: 1400}}
                modifiers={[{
                    name: 'sameWidth',
                    enabled: true,
                    phase: 'beforeWrite' as const,
                    requires: ['computeStyles'],
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    fn({state}: any) { state.styles.popper.width = `${state.rects.reference.width}px` },
                }]}
            >
                <Paper elevation={3}>
                    <div ref={dropdownRef} className={styles.listbox}>
                        {filtered.map((option, i) => (
                            <div
                                key={option.id}
                                data-idx={i}
                                className={[
                                    styles.option,
                                    focusedIndex === i ? styles.optionFocused : '',
                                    value?.id === option.id ? styles.optionSelected : '',
                                ].filter(Boolean).join(' ')}
                                onMouseDown={e => { e.preventDefault(); selectOption(option) }}
                            >
                                <span className={styles.optionName}>{option.name}</span>
                                {canEdit?.(option) && onEditClick && (
                                    <IconButton
                                        size='small'
                                        className={styles.optionEditBtn}
                                        onMouseDown={e => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                            const r = e.currentTarget.getBoundingClientRect()
                                            onEditClick(option, {top: r.bottom, left: r.left})
                                        }}
                                    >
                                        <MoreHorizIcon sx={{fontSize: 16}}/>
                                    </IconButton>
                                )}
                            </div>
                        ))}
                        {canCreate && (
                            <div
                                data-idx={filtered.length}
                                className={[styles.option, styles.createOption, focusedIndex === filtered.length ? styles.optionFocused : ''].filter(Boolean).join(' ')}
                                onMouseDown={e => { e.preventDefault(); void handleCreate() }}
                            >
                                {`Add "${inputValue.trim()}"`}
                            </div>
                        )}
                        {filtered.length === 0 && !canCreate && (
                            <div className={styles.noOptions}>No options</div>
                        )}
                    </div>
                </Paper>
            </Popper>
        </div>
    )
}
