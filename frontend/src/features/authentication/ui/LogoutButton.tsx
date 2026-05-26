import {useState} from 'react'
import {Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography} from '@mui/material'
import {LogoutOutlined} from '@mui/icons-material'
import {useAuthenticationStore} from '@/app/store/authenticationStore'

export function LogoutButton() {
    const logout = useAuthenticationStore(state => state.logout)
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button
                variant='outlined'
                color='error'
                startIcon={<LogoutOutlined/>}
                onClick={() => setOpen(true)}
            >
                Log out
            </Button>

            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Log out</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to log out?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant='contained' color='error' onClick={logout}>
                        Log out
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}
