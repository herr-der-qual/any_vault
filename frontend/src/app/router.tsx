import {createBrowserRouter} from 'react-router-dom'
import {LoginPage} from '@/pages/login'
import {HomePage} from '@/pages/home'
import {SettingsPage} from '@/pages/settings'
import {JoinPage} from '@/pages/join'
import {MainLayout} from '@/widgets/main-layout'
import {ProtectedRoute} from './ProtectedRoute'

export const router = createBrowserRouter([
    {path: '/login', element: <LoginPage/>},
    {path: '/join/:token', element: <JoinPage/>},
    {
        element: <ProtectedRoute/>,
        children: [
            {
                element: <MainLayout/>,
                children: [
                    {path: '/', element: <HomePage/>},
                    {path: '/settings', element: <SettingsPage/>},
                ],
            },
        ],
    },
])
