import { Navigate } from 'react-router-dom'
import { Paper } from '@mui/material'
import { LoginForm } from '@/features/authentication'
import { useAuthenticationStore } from '@/app/store/authenticationStore'
import styles from './LoginPage.module.scss'

export function LoginPage() {
    const user = useAuthenticationStore(state => state.user)

    if (user) return <Navigate to="/" replace />

    return (
        <div className={styles.page}>
            <Paper elevation={3} className={styles.card}>
                <LoginForm />
            </Paper>
        </div>
    )
}
