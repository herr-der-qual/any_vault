import {apiClient} from './client'

export interface Brand {
    id: number
    name: string
    group_id: number | null
}

export function getBrands() {
    return apiClient.get<Brand[]>('/brands/')
}

export function createBrand(name: string, groupId: number | null) {
    return apiClient.post<Brand>('/brands/', {name, group_id: groupId})
}

export function renameBrand(id: number, name: string) {
    return apiClient.patch<Brand>(`/brands/${id}/`, {name})
}

export function deleteBrand(id: number) {
    return apiClient.delete<void>(`/brands/${id}/`)
}
