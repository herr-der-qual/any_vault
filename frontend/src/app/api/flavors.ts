import {apiClient} from './client'
import type {Color} from './colors'

export type {Color}

export interface Flavor {
    id: number
    name: string
    color: Color | null
}

export function getFlavors() {
    return apiClient.get<Flavor[]>('/flavors/')
}

export function createFlavor(name: string) {
    return apiClient.post<Flavor>('/flavors/', {name})
}

export function updateFlavorColor(id: number, colorId: number | null) {
    return apiClient.patch<{id: number; color_id: number | null}>(`/flavors/${id}/set_color/`, {color_id: colorId})
}
