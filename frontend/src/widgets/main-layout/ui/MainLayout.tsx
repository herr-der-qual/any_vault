import {useState} from 'react'
import {Outlet} from 'react-router-dom'
import {Snackbar} from '@mui/material'
import {TabBar} from '@/widgets/tab-bar'
import {ProductDialog} from '@/features/product-table'
import styles from './MainLayout.module.scss'

export function MainLayout() {
    const [createOpen, setCreateOpen] = useState(false)
    const [snackbarOpen, setSnackbarOpen] = useState(false)

    return (
        <>
            <main className={styles.content}>
                <Outlet/>
            </main>
            <TabBar onAddClick={() => setCreateOpen(true)}/>
            <ProductDialog
                mode='create'
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onSaved={() => setSnackbarOpen(true)}
            />
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                message='Product added'
            />
        </>
    )
}
