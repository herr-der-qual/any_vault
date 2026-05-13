import {apiClient} from './client'

interface BulkEntry {
    user_id: number
    rating?: number | null
    comment?: string
}

export interface BulkCreateProductPayload {
    category: number
    brand: number | null
    variant: string
    flavors: number[]
    groups: number[]
    entries: BulkEntry[]
}

export function createProductBulk(payload: BulkCreateProductPayload) {
    return apiClient.post<{id: number; user_id: number}[]>('/products/bulk/', payload)
}
