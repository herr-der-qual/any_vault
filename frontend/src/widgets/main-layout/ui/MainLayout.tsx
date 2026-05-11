import {Outlet} from 'react-router-dom'
import {TabBar} from '@/widgets/tab-bar'
import styles from './MainLayout.module.scss'

export function MainLayout() {
    return (
        <>
            <main className={styles.content}>
                <Outlet/>
            </main>
            <TabBar/>
        </>
    )
}
