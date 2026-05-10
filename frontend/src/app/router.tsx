import {createBrowserRouter} from 'react-router-dom'
import {LoginPage} from '@/pages/login'
import {HomePage} from '@/pages/home'
import {ProtectedRoute} from './ProtectedRoute'

export const router = createBrowserRouter([
    {path: '/login', element: <LoginPage/>},
    {
        element: <ProtectedRoute/>,
        children: [
            {path: '/', element: <HomePage/>},
        ],
    },
])
