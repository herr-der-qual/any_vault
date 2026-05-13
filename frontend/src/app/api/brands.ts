import {apiClient} from './client'

export interface Brand {
    id: number
    name: string
}

export function getBrands() {
    return apiClient.get<Brand[]>('/brands/')
}

export function createBrand(name: string) {
    return apiClient.post<Brand>('/brands/', {name})
}
