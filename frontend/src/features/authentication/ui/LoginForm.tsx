import {useState} from 'react'
import {useForm} from 'react-hook-form'
import {useNavigate} from 'react-router-dom'
import {TextField, Button, Alert, Typography, IconButton, InputAdornment} from '@mui/material'
import {Visibility, VisibilityOff} from '@mui/icons-material'
import {useAuthenticationStore} from '@/app/store/authenticationStore'
import styles from './LoginForm.module.scss'

interface FormValues {
    email: string
    password: string
}

export function LoginForm() {
    const {register, handleSubmit, formState: {errors, isSubmitting}} = useForm<FormValues>()
    const storeLogin = useAuthenticationStore(state => state.login)
    const navigate = useNavigate()
    const [error, setError] = useState<string | null>(null)
    const [passwordVisible, setPasswordVisible] = useState(false)

    const onSubmit = async (data: FormValues) => {
        try {
            setError(null)
            await storeLogin(data.email, data.password)
            navigate('/', {replace: true})
        } catch {
            setError('Invalid email or password')
        }
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
            <Typography variant='h5' fontWeight={600}>Sign in</Typography>

            {error && <Alert severity='error'>{error}</Alert>}

            <TextField
                label='Email'
                type='email'
                autoComplete='email'
                autoFocus
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register('email', {required: 'Required'})}
            />
            <TextField
                label='Password'
                type={passwordVisible ? 'text' : 'password'}
                autoComplete='current-password'
                error={!!errors.password}
                helperText={errors.password?.message}
                slotProps={{
                    input: {
                        endAdornment: (
                            <InputAdornment position='end'>
                                <IconButton onClick={() => setPasswordVisible(previous => !previous)} edge='end'>
                                    {passwordVisible ? <VisibilityOff/> : <Visibility/>}
                                </IconButton>
                            </InputAdornment>
                        ),
                    },
                }}
                {...register('password', {required: 'Required'})}
            />

            <Button type='submit' variant='contained' size='large' loading={isSubmitting}>
                Sign in
            </Button>
        </form>
    )
}
