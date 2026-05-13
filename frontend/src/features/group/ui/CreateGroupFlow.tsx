import {useState} from 'react'
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from '@mui/material'
import {createGroup} from '@/app/api/groups'
import styles from './CreateGroupFlow.module.scss'

interface Props {
    open: boolean
    onClose: () => void
    onCreated: () => void
}

export function CreateGroupFlow({open, onClose, onCreated}: Props) {
    const [name, setName] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError('Name is required')
            return
        }
        setLoading(true)
        setError('')
        try {
            await createGroup(name.trim())
            setName('')
            onCreated()
            onClose()
        } catch (err: unknown) {
            const detail = (err as {response?: {data?: {name?: string[]}}}).response?.data?.name
            setError(detail?.[0] ?? 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        if (loading) return
        setName('')
        setError('')
        onClose()
    }

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth='xs'>
            <DialogTitle>Create group</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    fullWidth
                    label='Group name'
                    value={name}
                    onChange={event => setName(event.target.value)}
                    onKeyDown={event => { if (event.key === 'Enter') handleSubmit() }}
                    error={!!error}
                    helperText={error}
                    disabled={loading}
                    className={styles.field}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>Cancel</Button>
                <Button
                    variant='contained'
                    onClick={handleSubmit}
                    disabled={loading || !name.trim()}
                >
                    {loading ? <CircularProgress size={20} color='inherit'/> : 'Create'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
