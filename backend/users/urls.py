from django.urls import path

from .views import (
    GroupBulkInviteView,
    GroupEmailInviteView,
    GroupInviteListView,
    GroupInviteRevokeView,
    GroupQrImageView,
    GroupQrInviteView,
    JoinView,
    MeView,
)

urlpatterns = [
    path('me/', MeView.as_view(), name='user-me'),

    path('groups/<int:group_id>/invites/', GroupInviteListView.as_view(), name='group-invite-list'),
    path('groups/<int:group_id>/invites/email/', GroupEmailInviteView.as_view(), name='group-invite-email'),
    path('groups/<int:group_id>/invites/bulk/', GroupBulkInviteView.as_view(), name='group-invite-bulk'),
    path('groups/<int:group_id>/invites/qr/', GroupQrInviteView.as_view(), name='group-invite-qr'),
    path('groups/<int:group_id>/invites/<int:invite_id>/revoke/', GroupInviteRevokeView.as_view(), name='group-invite-revoke'),
    path('groups/<int:group_id>/invites/qr/<str:token>/image/', GroupQrImageView.as_view(), name='group-invite-qr-image'),

    path('join/<str:token>/', JoinView.as_view(), name='invite-join'),
]
