import axios from 'axios'
import type {InternalAxiosRequestConfig} from 'axios'

interface RetryableRequest extends InternalAxiosRequestConfig {
    _retry?: boolean
}

const client = axios.create({
    baseURL: '/api',
    headers: {'Content-Type': 'application/json'},
})

client.interceptors.request.use(config => {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

client.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest: RetryableRequest = error.config
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true
            const refreshToken = localStorage.getItem('refresh_token')
            if (refreshToken) {
                try {
                    const {data} = await axios.post('/api/token/refresh/', {refresh: refreshToken})
                    localStorage.setItem('access_token', data.access)
                    originalRequest.headers.Authorization = `Bearer ${data.access}`
                    return client(originalRequest)
                } catch {
                    localStorage.removeItem('access_token')
                    localStorage.removeItem('refresh_token')
                    window.location.href = '/login'
                }
            }
        }
        return Promise.reject(error)
    }
)

export const apiClient = {
    get: <T>(path: string) => client.get<T>(path).then(response => response.data),
    post: <T>(path: string, body: unknown) => client.post<T>(path, body).then(response => response.data),
}
