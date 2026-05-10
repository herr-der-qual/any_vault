import {useEffect} from 'react'
import {RouterProvider} from 'react-router-dom'
import {CssBaseline, StyledEngineProvider, ThemeProvider, createTheme} from '@mui/material'
import {router} from './app/router'
import {useAuthenticationStore} from './app/store/authenticationStore'

const theme = createTheme()

export function App() {
    const init = useAuthenticationStore(state => state.init)

    useEffect(() => {
        init()
    }, [init])

    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <RouterProvider router={router}/>
            </ThemeProvider>
        </StyledEngineProvider>
    )
}
