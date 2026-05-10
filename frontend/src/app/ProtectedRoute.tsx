import {Navigate, Outlet} from 'react-router-dom'
import {CircularProgress} from '@mui/material'
import {useAuthenticationStore} from './store/authenticationStore'
import styles from './ProtectedRoute.module.scss'

export function ProtectedRoute() {
    const user = useAuthenticationStore(state => state.user)
    const loading = useAuthenticationStore(state => state.loading)

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularProgress/>
            </div>
        )
    }

    return user ? <Outlet/> : <Navigate to="/login" replace/>
}
