import {apiClient} from './client'

export interface Flavor {
    id: number
    name: string
    color: string | null
}

export function getFlavors() {
    return apiClient.get<Flavor[]>('/flavors/')
}

export function createFlavor(name: string) {
    return apiClient.post<Flavor>('/flavors/', {name})
}

export function updateFlavorColor(id: number, color: string | null) {
    return apiClient.patch<{id: number; color: string}>(`/flavors/${id}/set_color/`, {color: color ?? ''})
}
