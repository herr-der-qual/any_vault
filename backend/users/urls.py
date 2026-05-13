from django.urls import path

from .views import (
    GroupBulkInviteView,
    GroupEmailInviteView,
    GroupInviteListView,
    GroupInviteRevokeView,
    GroupMemberRoleView,
    GroupMembersView,
    GroupQrImageView,
    GroupQrInviteView,
    JoinView,
    MeView,
    MyGroupsView,
)

urlpatterns = [
    path('me/', MeView.as_view(), name='user-me'),
    path('groups/', MyGroupsView.as_view(), name='my-groups'),

    path('groups/<int:group_id>/members/', GroupMembersView.as_view(), name='group-members'),
    path('groups/<int:group_id>/members/<int:user_id>/', GroupMemberRoleView.as_view(), name='group-member-role'),

    path('groups/<int:group_id>/invites/', GroupInviteListView.as_view(), name='group-invite-list'),
    path('groups/<int:group_id>/invites/email/', GroupEmailInviteView.as_view(), name='group-invite-email'),
    path('groups/<int:group_id>/invites/bulk/', GroupBulkInviteView.as_view(), name='group-invite-bulk'),
    path('groups/<int:group_id>/invites/qr/', GroupQrInviteView.as_view(), name='group-invite-qr'),
    path('groups/<int:group_id>/invites/<int:invite_id>/revoke/', GroupInviteRevokeView.as_view(), name='group-invite-revoke'),
    path('groups/<int:group_id>/invites/qr/<str:token>/image/', GroupQrImageView.as_view(), name='group-invite-qr-image'),

    path('join/<str:token>/', JoinView.as_view(), name='invite-join'),
]
