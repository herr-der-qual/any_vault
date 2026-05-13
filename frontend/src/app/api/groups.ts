import {apiClient} from './client'
import type {Group, GroupMember} from '@/entities/group'

export function getMyGroups() {
    return apiClient.get<Group[]>('/users/groups/')
}

export function createGroup(name: string) {
    return apiClient.post<Group>('/users/groups/', {name})
}

export function getGroupMembers(groupId: number) {
    return apiClient.get<GroupMember[]>(`/users/groups/${groupId}/members/`)
}

export function updateMemberRole(groupId: number, userId: number, role: string) {
    return apiClient.patch<{user_id: number, role: string}>(`/users/groups/${groupId}/members/${userId}/`, {role})
}
