import {apiClient} from './client'

export interface Category {
    id: number
    name: string
    group_id: number | null
}

export function getCategories() {
    return apiClient.get<Category[]>('/categories/')
}

export function createCategory(name: string, groupId: number | null) {
    return apiClient.post<Category>('/categories/', {name, group_id: groupId})
}
