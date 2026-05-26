import {useState, useRef, useEffect, useMemo} from 'react'
import {Chip, Checkbox, Popover, IconButton, Paper, Popper} from '@mui/material'
import {MoreHoriz as MoreHorizIcon} from '@mui/icons-material'
import type {Color} from '@/app/api/colors'
import styles from './ColoredMultiSelect.module.scss'

export type {Color}

export interface ColoredOption<T> {
    item: T
    color: Color | null
}

interface Props<T extends {id: number; name: string; color?: Color | null}> {
    options: T[]
    value: ColoredOption<T>[]
    colors: Color[]
    onChange: (value: ColoredOption<T>[]) => void
    onCreate?: (label: string) => Promise<T>
    canEdit?: (item: T) => boolean
    onEditClick?: (item: T, position: {top: number; left: number}) => void
    label?: string
    keepOpen?: boolean
}

export function ColoredMultiSelect<T extends {id: number; name: string; color?: Color | null}>({
    options, value, colors, onChange, onCreate, canEdit, onEditClick, label, keepOpen,
}: Props<T>) {
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [colorAnchorEl, setColorAnchorEl] = useState<HTMLElement | null>(null)
    const [coloringItemId, setColoringItemId] = useState<number | null>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const keepOpenRef = useRef(keepOpen ?? false)
    useEffect(() => { keepOpenRef.current = keepOpen ?? false }, [keepOpen])

    const selectedIds = useMemo(() => new Set(value.map(v => v.item.id)), [value])
    const coloringItem = value.find(v => v.item.id === coloringItemId)
    const useEditButton = Boolean(onEditClick)

    const filtered = useMemo(() => {
        const q = inputValue.toLowerCase()
        return q ? options.filter(o => o.name.toLowerCase().includes(q)) : options
    }, [options, inputValue])

    const canCreate = Boolean(
        onCreate &&
        inputValue.trim() &&
        !options.some(o => o.name.toLowerCase() === inputValue.trim().toLowerCase()),
    )

    // Close on outside mousedown -- skip while color picker is open
    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            const target = e.target as Node
            if (wrapperRef.current?.contains(target)) return
            if (dropdownRef.current?.contains(target)) return
            if (colorAnchorEl !== null) return
            if (keepOpenRef.current) return
            setOpen(false)
            setInputValue('')
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open, colorAnchorEl])

    const openDropdown = () => {
        setOpen(true)
        inputRef.current?.focus()
    }

    const toggleItem = (item: T) => {
        if (selectedIds.has(item.id)) {
            onChange(value.filter(v => v.item.id !== item.id))
        } else {
            onChange([...value, {item, color: item.color ?? null}])
        }
    }

    const handleCreate = async () => {
        if (!onCreate || !inputValue.trim()) return
        const created = await onCreate(inputValue.trim())
        onChange([...value, {item: created, color: null}])
        setInputValue('')
    }

    const handleColorClick = (el: HTMLElement, itemId: number) => {
        setColorAnchorEl(el)
        setColoringItemId(itemId)
    }

    const handleColorSelect = (color: Color | null) => {
        if (coloringItemId === null) return
        const idx = value.findIndex(v => v.item.id === coloringItemId)
        if (idx !== -1) {
            onChange(value.map((v, i) => i === idx ? {...v, color} : v))
        } else {
            const item = options.find(o => o.id === coloringItemId)
            if (item) onChange([...value, {item, color}])
        }
        setColorAnchorEl(null)
        setColoringItemId(null)
        // open is never touched -- dropdown stays open
    }

    const floated = open || value.length > 0 || Boolean(inputValue)

    return (
        <div ref={wrapperRef} className={styles.wrapper}>
            <div
                className={`${styles.container}${open ? ` ${styles.containerFocused}` : ''}`}
                onMouseDown={e => {
                    if (e.target === inputRef.current) return
                    e.preventDefault()
                    openDropdown()
                }}
            >
                {label && (
                    <span className={[
                        styles.label,
                        floated ? styles.labelFloated : '',
                        open ? styles.labelActive : '',
                    ].filter(Boolean).join(' ')}>
                        {label}
                    </span>
                )}
                <div className={styles.inner}>
                    {value.map(v => {
                        const bg = v.color?.primary
                        const fg = v.color?.secondary
                        return (
                            <Chip
                                key={v.item.id}
                                label={v.item.name}
                                size='small'
                                onDelete={() => onChange(value.filter(x => x.item.id !== v.item.id))}
                                sx={bg ? {
                                    backgroundColor: bg,
                                    color: fg,
                                    '& .MuiChip-deleteIcon': {color: fg, '&:hover': {color: fg, opacity: 0.7}},
                                } : {}}
                            />
                        )
                    })}
                    <input
                        ref={inputRef}
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onFocus={() => setOpen(true)}
                        onKeyDown={e => {
                            if (e.key === 'Escape') { setOpen(false); setInputValue('') }
                            else if (e.key === 'Enter' && canCreate) { void handleCreate() }
                            else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
                                onChange(value.slice(0, -1))
                            }
                        }}
                        className={styles.input}
                    />
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
                        {filtered.map(option => {
                            const selected = selectedIds.has(option.id)
                            const editable = canEdit?.(option) ?? false
                            const colorEntry = value.find(v => v.item.id === option.id)
                            return (
                                <div
                                    key={option.id}
                                    className={styles.option}
                                    onMouseDown={e => { e.preventDefault(); toggleItem(option) }}
                                >
                                    <Checkbox checked={selected} size='small' style={{marginRight: 4, padding: 0}}/>
                                    <Chip
                                        label={option.name}
                                        size='small'
                                        sx={{
                                            minWidth: 0,
                                            pointerEvents: 'none',
                                            ...(option.color?.primary ? {
                                                backgroundColor: option.color.primary,
                                                color: option.color.secondary,
                                            } : {}),
                                        }}
                                    />
                                    {useEditButton ? (
                                        editable && (
                                            <IconButton
                                                size='small'
                                                className={styles.optionEditBtn}
                                                onMouseDown={e => {
                                                    e.stopPropagation()
                                                    e.preventDefault()
                                                    const r = e.currentTarget.getBoundingClientRect()
                                                    onEditClick!(option, {top: r.bottom, left: r.left})
                                                }}
                                                onClick={e => { e.stopPropagation(); e.preventDefault() }}
                                            >
                                                <MoreHorizIcon sx={{fontSize: 16}}/>
                                            </IconButton>
                                        )
                                    ) : (
                                        <span
                                            className={styles.optionEditBtn}
                                            style={{background: colorEntry?.color?.primary ?? '#e0e0e0'}}
                                            onMouseDown={e => {
                                                e.stopPropagation()
                                                e.preventDefault()
                                                handleColorClick(e.currentTarget, option.id)
                                            }}
                                        />
                                    )}
                                </div>
                            )
                        })}
                        {canCreate && (
                            <div
                                className={`${styles.option} ${styles.createOption}`}
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

            {!useEditButton && (
                <Popover
                    open={Boolean(colorAnchorEl)}
                    anchorEl={colorAnchorEl}
                    onClose={() => { setColorAnchorEl(null); setColoringItemId(null) }}
                    anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
                    transformOrigin={{vertical: 'top', horizontal: 'left'}}
                    disableAutoFocus
                    disableEnforceFocus
                >
                    <div className={styles.colorGrid} onMouseDown={e => e.preventDefault()}>
                        <span
                            className={`${styles.colorSwatch} ${coloringItem?.color === null ? styles.active : ''}`}
                            style={{background: '#f5f5f5', border: '1.5px dashed #bdbdbd'}}
                            onClick={() => handleColorSelect(null)}
                            title='None'
                        />
                        {colors.map(c => (
                            <span
                                key={c.id}
                                className={`${styles.colorSwatch} ${coloringItem?.color?.id === c.id ? styles.active : ''}`}
                                style={{background: c.secondary}}
                                onClick={() => handleColorSelect(c)}
                                title={c.name}
                            />
                        ))}
                    </div>
                </Popover>
            )}
        </div>
    )
}

