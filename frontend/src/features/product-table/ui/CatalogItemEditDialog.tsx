import {useState, useEffect} from 'react'
import {Popover, Button, TextField, InputAdornment, IconButton} from '@mui/material'
import {DeleteOutlined, ClearOutlined} from '@mui/icons-material'
import styles from './FlavorEditDialog.module.scss'

interface Props {
    position: {top: number; left: number} | null
    name: string
    onClose: () => void
    onSave: (name: string) => Promise<void>
    onDelete: () => Promise<void>
}

export function CatalogItemEditDialog({position, name: initialName, onClose, onSave, onDelete}: Props) {
    const [name, setName] = useState(initialName)
    const [deleting, setDeleting] = useState(false)

    const open = Boolean(position)

    useEffect(() => {
        if (open) setName(initialName)
    }, [open, initialName])

    const save = async () => {
        const trimmed = name.trim()
        if (!trimmed || trimmed === initialName) return
        await onSave(trimmed)
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            await onDelete()
            onClose()
        } finally {
            setDeleting(false)
        }
    }

    return (
        <Popover
            open={open}
            anchorReference='anchorPosition'
            anchorPosition={position ?? undefined}
            onClose={onClose}
            transformOrigin={{vertical: 'top', horizontal: 'left'}}
            disableAutoFocus
            disableEnforceFocus
            style={{zIndex: 1500}}
        >
            <div className={styles.content}>
                <TextField
                    label='Name'
                    size='small'
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onBlur={save}
                    onKeyDown={e => {
                        if (e.key === 'Enter') { void save(); onClose() }
                    }}
                    slotProps={{
                        input: {
                            endAdornment: name ? (
                                <InputAdornment position='end'>
                                    <IconButton size='small' edge='end' onClick={() => setName('')}>
                                        <ClearOutlined fontSize='small'/>
                                    </IconButton>
                                </InputAdornment>
                            ) : null,
                        },
                    }}
                />
                <div className={styles.actions}>
                    <IconButton color='error' onClick={handleDelete} disabled={deleting} size='small'>
                        <DeleteOutlined fontSize='small'/>
                    </IconButton>
                    <Button size='small' onClick={onClose} disabled={deleting}>Close</Button>
                </div>
            </div>
        </Popover>
    )
}
