export interface Group {
    id: number
    name: string
    role: 'admin' | 'moderator' | 'editor' | 'view_only'
}

export interface GroupMember {
    user_id: number
    email: string
    username: string
    first_name: string
    last_name: string
    role: string
}
