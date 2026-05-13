import {apiClient} from './client'

export interface Flavor {
    id: number
    name: string
}

export function getFlavors() {
    return apiClient.get<Flavor[]>('/flavors/')
}

export function createFlavor(name: string) {
    return apiClient.post<Flavor>('/flavors/', {name})
}
