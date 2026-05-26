import {useState, useEffect} from 'react'
import {
    Popover, Button, TextField, Typography, Divider, InputAdornment, IconButton,
} from '@mui/material'
import {DeleteOutlined, ClearOutlined, CloseOutlined} from '@mui/icons-material'
import type {Flavor} from '@/app/api/flavors'
import type {Color} from '@/app/api/colors'
import styles from './FlavorEditDialog.module.scss'

interface Props {
    position: {top: number; left: number} | null
    flavor: Flavor
    initialColor: Color | null
    colors: Color[]
    onClose: () => void
    onSave: (name: string, color: Color | null) => Promise<void>
    onDelete: () => Promise<void>
}

export function FlavorEditDialog({position, flavor, initialColor, colors, onClose, onSave, onDelete}: Props) {
    const [name, setName] = useState(flavor.name)
    const [color, setColor] = useState<Color | null>(initialColor)
    const [deleting, setDeleting] = useState(false)

    const open = Boolean(position)

    useEffect(() => {
        if (open) {
            setName(flavor.name)
            setColor(initialColor)
        }
    }, [open, flavor.id])

    const saveName = async () => {
        const trimmed = name.trim()
        if (!trimmed || trimmed === flavor.name) return
        await onSave(trimmed, color)
    }

    const handleColorSelect = async (newColor: Color | null) => {
        setColor(newColor)
        await onSave(name.trim() || flavor.name, newColor)
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
                    onBlur={saveName}
                    onKeyDown={e => {
                        if (e.key === 'Enter') { void saveName(); onClose() }
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

                <div>
                    <div className={styles.colorGrid}>
                        {colors.map(c => (
                            <span
                                key={c.id}
                                className={`${styles.colorSwatch} ${color?.id === c.id ? styles.active : ''}`}
                                style={{background: c.secondary}}
                                onClick={() => handleColorSelect(c)}
                                title={c.name}
                            />
                        ))}
                        <span
                            className={`${styles.colorSwatch} ${color === null ? styles.active : ''}`}
                            style={{background: '#f5f5f5', border: '1.5px dashed #bdbdbd'}}
                            onClick={() => handleColorSelect(null)}
                            title='None'
                        />
                    </div>
                </div>
                <div className={styles.actions}>
                    <IconButton
                        color='error'
                        onClick={handleDelete}
                        disabled={deleting}
                        size='small'
                    >
                        <DeleteOutlined fontSize='small'/>
                    </IconButton>
                    <Button size='small' onClick={onClose} disabled={deleting}>
                        Close
                    </Button>
                </div>
            </div>
        </Popover>
    )
}
