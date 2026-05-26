import {useState, useEffect} from 'react'
import {Alert, Button, CircularProgress, MenuItem, Select, Snackbar, Typography} from '@mui/material'
import {AddOutlined, LinkOutlined} from '@mui/icons-material'
import {getMyGroups, getGroupMembers, updateMemberRole} from '@/app/api/groups'
import {createQrInvite} from '@/app/api/invites'
import {CreateGroupFlow} from '@/features/group'
import {LogoutButton} from '@/features/authentication'
import {useAuthenticationStore} from '@/app/store/authenticationStore'
import type {Group, GroupMember} from '@/entities/group'
import styles from './SettingsPage.module.scss'

const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin',
    moderator: 'Moderator',
    view_only: 'View only',
}

const ROLE_OPTIONS = ['admin', 'moderator', 'view_only'] as const

export function SettingsPage() {
    const user = useAuthenticationStore(state => state.user)
    const [groups, setGroups] = useState<Group[]>([])
    const [members, setMembers] = useState<Record<number, GroupMember[]>>({})
    const [createOpen, setCreateOpen] = useState(false)
    const [copying, setCopying] = useState<number | null>(null)
    const [snackbarOpen, setSnackbarOpen] = useState(false)

    const loadGroups = async () => {
        const all = await getMyGroups()
        setGroups(all)
        const entries = await Promise.all(
            all.map(async group => [group.id, await getGroupMembers(group.id)] as const)
        )
        setMembers(Object.fromEntries(entries))
    }

    useEffect(() => {
        loadGroups()
    }, [])

    const handleCopyInvite = async (groupId: number) => {
        setCopying(groupId)
        try {
            const invite = await createQrInvite(groupId)
            await navigator.clipboard.writeText(`${window.location.origin}/join/${invite.token}`)
            setSnackbarOpen(true)
        } finally {
            setCopying(null)
        }
    }

    const handleRoleChange = async (groupId: number, userId: number, role: string) => {
        await updateMemberRole(groupId, userId, role)
        setMembers(prev => ({
            ...prev,
            [groupId]: (prev[groupId] ?? []).map(member =>
                member.user_id === userId ? {...member, role} : member
            ),
        }))
    }

    return (
        <div className={styles.page}>
            <Typography variant='h4'>Settings</Typography>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Typography variant='h6'>Groups</Typography>
                    <Button
                        variant='contained'
                        startIcon={<AddOutlined/>}
                        onClick={() => setCreateOpen(true)}
                    >
                        New group
                    </Button>
                </div>

                {groups.map(group => (
                    <div key={group.id} className={styles.groupCard}>
                        <div className={styles.groupHeader}>
                            <Typography variant='subtitle1'>{group.name}</Typography>
                            {group.role === 'admin' && (
                                <Button
                                    variant='outlined'
                                    size='small'
                                    startIcon={copying === group.id
                                        ? <CircularProgress size={14} color='inherit'/>
                                        : <LinkOutlined/>
                                    }
                                    disabled={copying === group.id}
                                    onClick={() => handleCopyInvite(group.id)}
                                >
                                    Copy invite link
                                </Button>
                            )}
                        </div>

                        <div className={styles.memberList}>
                            {(members[group.id] ?? []).map(member => (
                                <div key={member.user_id} className={styles.memberRow}>
                                    <Typography variant='body2'>{member.email}</Typography>
                                    {group.role === 'admin' && member.user_id !== user?.id ? (
                                        <Select
                                            value={member.role}
                                            size='small'
                                            onChange={event => handleRoleChange(group.id, member.user_id, event.target.value)}
                                        >
                                            {ROLE_OPTIONS.map(role => (
                                                <MenuItem key={role} value={role}>{ROLE_LABELS[role]}</MenuItem>
                                            ))}
                                        </Select>
                                    ) : (
                                        <Typography variant='body2' className={styles.roleLabel}>
                                            {ROLE_LABELS[member.role] ?? member.role}
                                        </Typography>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <CreateGroupFlow
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={loadGroups}
            />

            <div className={styles.footer}>
                <LogoutButton/>
            </div>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{vertical: 'top', horizontal: 'center'}}
            >
                <Alert severity='success' variant='filled' onClose={() => setSnackbarOpen(false)}>
                    Invite link copied!
                </Alert>
            </Snackbar>
        </div>
    )
}
