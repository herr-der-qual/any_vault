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

export function renameCategory(id: number, name: string) {
    return apiClient.patch<Category>(`/categories/${id}/`, {name})
}

export function deleteCategory(id: number) {
    return apiClient.delete<void>(`/categories/${id}/`)
}
