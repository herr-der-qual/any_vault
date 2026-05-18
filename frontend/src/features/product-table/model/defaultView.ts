import type {ColumnConfig, SortConfig, ViewConfig} from './types'

export const DEFAULT_COLUMNS: ColumnConfig[] = [
    {id: 'category', visible: true},
    {id: 'brand_variant', visible: true},
    {id: 'flavors', visible: true},
    {id: 'my_rating', visible: true},
    {id: 'my_comment', visible: true},
]

export const DEFAULT_SORTING: SortConfig[] = [
    {field: 'category__name', direction: 'asc'},
    {field: 'brand__name', direction: 'asc'},
]

export const DEFAULT_VIEW_CONFIG: ViewConfig = {
    columns: DEFAULT_COLUMNS,
    sorting: DEFAULT_SORTING,
    filters: [],
}
