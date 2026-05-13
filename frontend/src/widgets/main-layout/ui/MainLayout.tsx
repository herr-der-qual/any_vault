import {useState} from 'react'
import {Outlet} from 'react-router-dom'
import {TabBar} from '@/widgets/tab-bar'
import {CreateProductFlow} from '@/features/product'
import styles from './MainLayout.module.scss'

export function MainLayout() {
    const [productFlowOpen, setProductFlowOpen] = useState(false)

    return (
        <>
            <main className={styles.content}>
                <Outlet/>
            </main>
            <TabBar onAddClick={() => setProductFlowOpen(true)}/>
            <CreateProductFlow
                open={productFlowOpen}
                onClose={() => setProductFlowOpen(false)}
            />
        </>
    )
}
