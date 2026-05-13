import {apiClient} from './client'

export interface Category {
    id: number
    name: string
}

export function getCategories() {
    return apiClient.get<Category[]>('/categories/')
}

export function createCategory(name: string) {
    return apiClient.post<Category>('/categories/', {name})
}
