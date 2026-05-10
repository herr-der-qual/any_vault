import {apiClient} from './client'
import type {User} from '@/entities/user'

interface LoginPayload {
    email: string
    password: string
}

interface TokenResponse {
    access: string
    refresh: string
}

export const login = (payload: LoginPayload) =>
    apiClient.post<TokenResponse>('/token/', payload)

export const getMe = () =>
    apiClient.get<User>('/users/me/')
