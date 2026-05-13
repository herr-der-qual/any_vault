import {useState, useEffect} from 'react'
import {useParams, useNavigate} from 'react-router-dom'
import {Button, CircularProgress, Paper, Typography} from '@mui/material'
import {getInvite, acceptInvite} from '@/app/api/invites'
import {useAuthenticationStore} from '@/app/store/authenticationStore'
import type {InviteInfo} from '@/app/api/invites'
import styles from './JoinPage.module.scss'

type Status = 'loading' | 'valid' | 'gone' | 'not_found' | 'joined'

const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin',
    moderator: 'Moderator',
    view_only: 'View only',
}

export function JoinPage() {
    const {token} = useParams<{token: string}>()
    const navigate = useNavigate()
    const user = useAuthenticationStore(state => state.user)
    const loading = useAuthenticationStore(state => state.loading)

    const [status, setStatus] = useState<Status>('loading')
    const [invite, setInvite] = useState<InviteInfo | null>(null)
    const [joining, setJoining] = useState(false)
    const [joinError, setJoinError] = useState('')

    useEffect(() => {
        if (!token) return
        getInvite(token)
            .then(data => {
                setInvite(data)
                setStatus('valid')
            })
            .catch((err: {response?: {status?: number}}) => {
                setStatus(err.response?.status === 410 ? 'gone' : 'not_found')
            })
    }, [token])

    const handleJoin = async () => {
        if (!token) return
        setJoining(true)
        setJoinError('')
        try {
            await acceptInvite(token)
            setStatus('joined')
        } catch (err: unknown) {
            const detail = (err as {response?: {data?: {detail?: string}}}).response?.data?.detail
            setJoinError(detail ?? 'Something went wrong')
        } finally {
            setJoining(false)
        }
    }

    if (loading || status === 'loading') {
        return (
            <div className={styles.center}>
                <CircularProgress/>
            </div>
        )
    }

    if (status === 'not_found') {
        return (
            <div className={styles.center}>
                <Typography color='text.secondary'>Invite not found.</Typography>
            </div>
        )
    }

    if (status === 'gone') {
        return (
            <div className={styles.center}>
                <Typography color='text.secondary'>This invite has expired or has already been used.</Typography>
            </div>
        )
    }

    if (status === 'joined') {
        return (
            <div className={styles.center}>
                <Paper className={styles.card}>
                    <Typography variant='h6'>You joined {invite?.group_name}!</Typography>
                    <Button variant='contained' onClick={() => navigate('/')}>Go to home</Button>
                </Paper>
            </div>
        )
    }

    return (
        <div className={styles.center}>
            <Paper className={styles.card}>
                <Typography variant='h5'>{invite?.group_name}</Typography>
                <Typography color='text.secondary'>
                    {invite?.invited_by_email} invited you as {ROLE_LABELS[invite?.role ?? ''] ?? invite?.role}
                </Typography>

                {joinError && (
                    <Typography color='error'>{joinError}</Typography>
                )}

                {user ? (
                    <Button
                        variant='contained'
                        onClick={handleJoin}
                        disabled={joining}
                        startIcon={joining ? <CircularProgress size={18} color='inherit'/> : undefined}
                    >
                        Join group
                    </Button>
                ) : (
                    <Button variant='contained' onClick={() => navigate('/login')}>
                        Sign in to join
                    </Button>
                )}
            </Paper>
        </div>
    )
}
