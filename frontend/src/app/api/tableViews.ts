import {apiClient} from './client'

export interface TableViewConfig {
    columns: unknown[]
    sorting: unknown[]
    filters: unknown[]
}

export interface TableView {
    id: number
    name: string
    group: number
    config: TableViewConfig
    is_default: boolean
    order: number
    created_at: string
    updated_at: string
}

export function getTableViews(groupId?: number) {
    return apiClient.get<TableView[]>('/table-views/', groupId ? {group_id: groupId} : undefined)
}

export function createTableView(data: {name: string; group: number; config: TableViewConfig; is_default?: boolean}) {
    return apiClient.post<TableView>('/table-views/', data)
}

export function updateTableView(id: number, data: Partial<{name: string; config: TableViewConfig; is_default: boolean}>) {
    return apiClient.patch<TableView>(`/table-views/${id}/`, data)
}

export function deleteTableView(id: number) {
    return apiClient.delete(`/table-views/${id}/`)
}

export function reorderTableViews(ids: number[]) {
    return apiClient.post<void>('/table-views/reorder/', {ids})
}
