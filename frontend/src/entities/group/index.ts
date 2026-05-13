export interface Group {
    id: number
    name: string
    role: 'admin' | 'moderator' | 'view_only'
}

export interface GroupMember {
    user_id: number
    email: string
    username: string
    role: string
}
