import {apiClient} from './client'
import type {Color} from './colors'

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

export interface ProductRating {
    user_id: number
    value: number
}

export interface ProductComment {
    user_id: number
    text: string
}

export interface ProductRow {
    id: number
    category: string
    category_id: number
    brand: string | null
    brand_id: number | null
    variant: string
    flavors: {name: string; color: Color | null}[]
    flavor_ids: number[]
    ratings: ProductRating[]
    comments: ProductComment[]
    image: string | null
}

export interface ProductsResponse {
    results: ProductRow[]
    count: number
}

export function createProductBulk(payload: BulkCreateProductPayload) {
    return apiClient.post<{id: number; user_id: number}[]>('/products/bulk/', payload)
}

export function getProducts(params: Record<string, string | number | boolean | undefined>) {
    return apiClient.get<ProductsResponse>('/products/', params)
}

export function updateProduct(id: number, data: {category?: number; brand?: number | null; variant?: string; flavors?: number[]}) {
    return apiClient.patch<ProductRow>(`/products/${id}/`, data)
}

export function rateProduct(id: number, value: number | null, userId?: number) {
    return apiClient.post<void>(`/products/${id}/rate/`, {value, user_id: userId})
}

export function commentProduct(id: number, text: string, userId?: number) {
    return apiClient.post<void>(`/products/${id}/comment/`, {text, user_id: userId})
}
