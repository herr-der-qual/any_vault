import {
    Drawer, List, ListItem, IconButton, Typography, Divider,
    Select, MenuItem, TextField, Button,
} from '@mui/material'
import {Close as CloseIcon, Delete as DeleteIcon, Add as AddIcon} from '@mui/icons-material'
import type {FilterConfig, FilterOperator} from '../model/types'
import styles from './FilterPanel.module.scss'

const FILTER_FIELDS = [
    {value: 'category', label: 'Category'},
    {value: 'brand', label: 'Brand'},
    {value: 'flavor', label: 'Flavor'},
    {value: 'no_sugar', label: 'No sugar'},
]

const OPERATORS: {value: FilterOperator; label: string}[] = [
    {value: 'eq', label: '='},
    {value: 'neq', label: '≠'},
    {value: 'contains', label: 'contains'},
    {value: 'not_contains', label: 'not contains'},
]

interface Props {
    open: boolean
    filters: FilterConfig[]
    onClose: () => void
    onChange: (filters: FilterConfig[]) => void
}

export function FilterPanel({open, filters, onClose, onChange}: Props) {
    const update = (index: number, patch: Partial<FilterConfig>) => {
        onChange(filters.map((f, i) => i === index ? {...f, ...patch} : f))
    }

    return (
        <Drawer
            anchor='right'
            open={open}
            onClose={onClose}
        >
            <div className={styles.panel}>
                <div className={styles.panelHeader}>
                    <Typography
                        variant='subtitle1'
                        className={styles.panelTitle}
                    >
                        Filters
                    </Typography>
                    <IconButton
                        onClick={onClose}
                        size='small'
                    >
                        <CloseIcon/>
                    </IconButton>
                </div>
                <Divider/>
                <List dense>
                    {filters.map((filter, i) => (
                        <ListItem
                            key={i}
                            disablePadding
                            className={styles.filterRow}
                        >
                            <Select
                                size='small'
                                value={filter.field}
                                onChange={e => {
                                    const field = e.target.value
                                    update(i, field === 'no_sugar'
                                        ? {field, operator: 'eq', value: 'true'}
                                        : {field}
                                    )
                                }}
                                className={styles.fieldSelect}
                            >
                                {FILTER_FIELDS.map(f => (
                                    <MenuItem key={f.value} value={f.value}>
                                        {f.label}
                                    </MenuItem>
                                ))}
                            </Select>
                            {filter.field === 'no_sugar' ? (
                                <Select
                                    size='small'
                                    value={filter.value || 'true'}
                                    onChange={e => update(i, {value: e.target.value})}
                                    className={styles.valueField}
                                >
                                    <MenuItem value='true'>Yes</MenuItem>
                                    <MenuItem value='false'>No</MenuItem>
                                </Select>
                            ) : (
                                <>
                                    <Select
                                        size='small'
                                        value={filter.operator}
                                        onChange={e => update(i, {operator: e.target.value as FilterOperator})}
                                        className={styles.operatorSelect}
                                    >
                                        {OPERATORS.map(op => (
                                            <MenuItem key={op.value} value={op.value}>
                                                {op.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <TextField
                                        size='small'
                                        value={filter.value}
                                        onChange={e => update(i, {value: e.target.value})}
                                        className={styles.valueField}
                                    />
                                </>
                            )}
                            <IconButton
                                size='small'
                                onClick={() => onChange(filters.filter((_, j) => j !== i))}
                            >
                                <DeleteIcon fontSize='small'/>
                            </IconButton>
                        </ListItem>
                    ))}
                </List>
                <div className={styles.addRow}>
                    <Button
                        startIcon={<AddIcon/>}
                        size='small'
                        onClick={() => onChange([...filters, {field: 'category', operator: 'contains', value: ''}])}
                    >
                        Add filter
                    </Button>
                </div>
            </div>
        </Drawer>
    )
}
