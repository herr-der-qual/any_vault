import {useState, useCallback} from 'react'
import type React from 'react'
import {Autocomplete, TextField, Chip, Popover, Checkbox} from '@mui/material'
import {createFilterOptions} from '@mui/material'
import styles from './ColoredMultiSelect.module.scss'

export interface ColoredOption<T> {
    item: T
    color: string | null
}

export const COLORS = [
    {label: 'Light green', value: '#a5d6a7', text: '#000'},
    {label: 'Pink',        value: '#f48fb1', text: '#000'},
    {label: 'Purple',      value: '#ce93d8', text: '#000'},
    {label: 'Light gray',  value: '#e0e0e0', text: '#000'},
    {label: 'Blue',        value: '#64b5f6', text: '#000'},
    {label: 'Light blue',  value: '#81d4fa', text: '#000'},
    {label: 'Orange',      value: '#ffb74d', text: '#000'},
    {label: 'Yellow',      value: '#fff176', text: '#000'},
    {label: 'Red',         value: '#ef9a9a', text: '#000'},
    {label: 'Brown',       value: '#a1887f', text: '#fff'},
    {label: 'Dark gray',   value: '#757575', text: '#fff'},
    {label: 'Dark green',  value: '#388e3c', text: '#fff'},
]

type Creatable<T> = T & {inputValue?: string}
const baseFilter = createFilterOptions<{id: number; name: string; inputValue?: string}>()

interface Props<T extends {id: number; name: string; color?: string | null}> {
    options: T[]
    value: ColoredOption<T>[]
    onChange: (value: ColoredOption<T>[]) => void
    onCreate?: (label: string) => Promise<T>
    label?: string
}

export function ColoredMultiSelect<T extends {id: number; name: string; color?: string | null}>({
    options, value, onChange, onCreate, label,
}: Props<T>) {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
    const [coloringItemId, setColoringItemId] = useState<number | null>(null)

    const handleColorClick = useCallback((el: HTMLElement, itemId: number) => {
        setAnchorEl(el)
        setColoringItemId(itemId)
    }, [])

    const handleColorSelect = (color: string | null) => {
        if (coloringItemId === null) return
        const idx = value.findIndex(v => v.item.id === coloringItemId)
        if (idx !== -1) {
            onChange(value.map((v, i) => i === idx ? {...v, color} : v))
        } else {
            const item = options.find(o => o.id === coloringItemId)
            if (item) onChange([...value, {item, color}])
        }
        setAnchorEl(null)
        setColoringItemId(null)
    }

    const handleChange = (_: unknown, newItems: Creatable<T>[]) => {
        const createItem = newItems.find(i => i.inputValue)
        if (createItem?.inputValue && onCreate) {
            void onCreate(createItem.inputValue).then(created => {
                const kept = newItems.filter(i => !i.inputValue)
                onChange([
                    ...kept.map(item => value.find(v => v.item.id === item.id) ?? {item, color: item.color ?? null}),
                    {item: created, color: null},
                ])
            })
        } else {
            onChange(newItems.map(item => value.find(v => v.item.id === item.id) ?? {item, color: item.color ?? null}))
        }
    }

    const autocompleteValue = value.map(v => v.item as Creatable<T>)
    const coloringItem = value.find(v => v.item.id === coloringItemId)

    return (
        <>
            <Autocomplete<Creatable<T>, true>
                multiple
                disableCloseOnSelect
                options={options as Creatable<T>[]}
                value={autocompleteValue}
                getOptionLabel={o => o.inputValue ? `Add "${o.inputValue}"` : o.name}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                filterOptions={(opts, params) => {
                    const filtered = baseFilter(opts, params) as Creatable<T>[]
                    if (
                        onCreate &&
                        params.inputValue &&
                        !opts.some(o => o.name.toLowerCase() === params.inputValue.toLowerCase())
                    ) {
                        filtered.push({id: -1, name: params.inputValue, inputValue: params.inputValue} as Creatable<T>)
                    }
                    return filtered
                }}
                onChange={handleChange}
                slotProps={{listbox: {style: {padding: '8px'}}}}
                selectOnFocus
                clearOnBlur
                handleHomeEndKeys
                renderValue={(tagValue, getItemProps) =>
                    tagValue.map((option, index) => {
                        const {key, ...itemProps} = getItemProps({index})
                        const colored = value[index]
                        const bg = colored?.color ?? undefined
                        const fg = bg ? (COLORS.find(c => c.value === bg)?.text ?? '#000') : undefined
                        return (
                            <Chip
                                key={key}
                                {...itemProps}
                                label={option.name}
                                sx={bg ? {
                                    backgroundColor: bg,
                                    color: fg,
                                    '& .MuiChip-deleteIcon': {
                                        color: fg,
                                        '&:hover': {color: fg, opacity: 0.7},
                                    },
                                } : {}}
                            />
                        )
                    })
                }
                renderOption={(liProps, option, {selected}) => {
                    const {key, ...rest} = liProps as React.HTMLAttributes<HTMLLIElement> & {key: React.Key}
                    if (option.inputValue) {
                        return <li key={key} {...rest}>{`Add "${option.inputValue}"`}</li>
                    }
                    const colored = value.find(v => v.item.id === option.id)
                    return (
                        <li key={key} {...rest} className={styles.option}>
                            <Checkbox
                                checked={selected}
                                size='small'
                                style={{marginRight: 4, padding: 0}}
                            />
                            <span className={styles.optionName}>{option.name}</span>
                            <span
                                className={styles.optionEditBtn}
                                style={{background: colored?.color ?? '#e0e0e0'}}
                                onMouseDown={e => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    handleColorClick(e.currentTarget, option.id)
                                }}
                            />
                        </li>
                    )
                }}
                renderInput={params => (
                    <TextField
                        {...params}
                        label={label}
                        size='small'
                    />
                )}
            />
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={() => { setAnchorEl(null); setColoringItemId(null) }}
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
                    {COLORS.map(c => (
                        <span
                            key={c.value}
                            className={`${styles.colorSwatch} ${coloringItem?.color === c.value ? styles.active : ''}`}
                            style={{background: c.value}}
                            onClick={() => handleColorSelect(c.value)}
                            title={c.label}
                        />
                    ))}
                </div>
            </Popover>
        </>
    )
}
