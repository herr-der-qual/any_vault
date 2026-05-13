import {apiClient} from './client'

interface GroupInvite {
    id: number
    token: string
    invite_type: string
    role: string
}

export interface InviteInfo {
    token: string
    group_name: string
    role: string
    invited_by_email: string
    expires_at: string | null
    invite_type: string
}

export function createQrInvite(groupId: number) {
    return apiClient.post<GroupInvite>(`/users/groups/${groupId}/invites/qr/`, {role: 'view_only'})
}

export function getInvite(token: string) {
    return apiClient.get<InviteInfo>(`/users/join/${token}/`)
}

export function acceptInvite(token: string) {
    return apiClient.post<{detail: string}>(`/users/join/${token}/`, {})
}
