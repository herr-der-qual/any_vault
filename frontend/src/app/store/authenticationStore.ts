import { create } from 'zustand'
import { login as apiLogin, getMe } from '../api/authenticate'
import type { User } from '@/entities/user'

interface AuthenticationState {
  user: User | null
  loading: boolean
  init: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthenticationStore = create<AuthenticationState>()(set => ({
    user: null,
    loading: true,

    init: async () => {
        const token = localStorage.getItem('access_token')
        if (!token) {
            set({ loading: false })
            return
        }
        try {
            const user = await getMe()
            set({ user, loading: false })
        } catch {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            set({ user: null, loading: false })
        }
    },

    login: async (email, password) => {
        const { access, refresh } = await apiLogin({ email, password })
        localStorage.setItem('access_token', access)
        localStorage.setItem('refresh_token', refresh)
        const user = await getMe()
        set({ user })
    },

    logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null })
    },
}))
