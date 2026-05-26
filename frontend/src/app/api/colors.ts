import {apiClient} from './client'

export interface Color {
    id: number
    name: string
    primary: string
    secondary: string
}

export function getColors() {
    return apiClient.get<Color[]>('/colors/')
}
