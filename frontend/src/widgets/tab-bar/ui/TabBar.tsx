import {NavLink} from 'react-router-dom'
import {HomeOutlined, Add, SettingsOutlined} from '@mui/icons-material'
import clsx from 'clsx'
import styles from './TabBar.module.scss'

export function TabBar() {
    return (
        <nav className={styles.tabBar}>
            <NavLink
                to='/'
                end
                className={({isActive}) => clsx(styles.tab, isActive && styles.active)}
            >
                <HomeOutlined/>
            </NavLink>

            <button type='button' className={clsx(styles.tab, styles.addButton)}>
                <Add/>
            </button>

            <NavLink
                to='/settings'
                className={({isActive}) => clsx(styles.tab, isActive && styles.active)}
            >
                <SettingsOutlined/>
            </NavLink>
        </nav>
    )
}
