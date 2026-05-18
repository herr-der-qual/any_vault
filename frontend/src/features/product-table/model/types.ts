export type ColumnId =
    | 'category'
    | 'brand_variant'
    | 'flavors'
    | 'my_rating'
    | 'my_comment'
    | `rating_${number}`
    | `comment_${number}`

export interface ColumnConfig {
    id: ColumnId
    visible: boolean
    label?: string
    userId?: number
}

export interface SortConfig {
    field: string
    direction: 'asc' | 'desc'
}

export type FilterOperator = 'eq' | 'neq' | 'contains' | 'not_contains'

export interface FilterConfig {
    field: string
    operator: FilterOperator
    value: string
}

export interface ViewConfig {
    columns: ColumnConfig[]
    sorting: SortConfig[]
    filters: FilterConfig[]
}
