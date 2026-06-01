import io
import uuid

import qrcode
from django.conf import settings
from django.db import models
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView as BaseTokenObtainPairView

from .models import GroupInvite, GroupMembership, User, UserGroup
from .serializers import (
    BulkInviteSerializer,
    EmailInviteSerializer,
    GroupInviteSerializer,
    JoinInfoSerializer,
    QrInviteSerializer,
    UserSerializer,
)


class MyGroupsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        memberships = GroupMembership.objects.filter(user=request.user).select_related('group')
        data = [{'id': m.group.id, 'name': m.group.name, 'role': m.role} for m in memberships]
        return Response(data)

    def post(self, request):
        name = str(request.data.get('name', '')).strip()
        if not name:
            return Response({'name': ['This field is required.']}, status=400)
        if UserGroup.objects.filter(name=name).exists():
            return Response({'name': ['A group with this name already exists.']}, status=400)
        group = UserGroup.objects.create(
            name=name,
            description=str(request.data.get('description', '')).strip(),
        )
        GroupMembership.objects.create(user=request.user, group=group, role='admin')
        return Response({'id': group.id, 'name': group.name, 'role': 'admin'}, status=201)


class MeView(RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user


class GroupMemberPermission(BasePermission):
    def has_permission(self, request, view):
        group_id = view.kwargs.get('group_id')
        return GroupMembership.objects.filter(user=request.user, group_id=group_id).exists()


class GroupAdminPermission(BasePermission):
    def has_permission(self, request, view):
        group_id = view.kwargs.get('group_id')
        try:
            membership = GroupMembership.objects.get(user=request.user, group_id=group_id)
            return membership.can_manage_group()
        except GroupMembership.DoesNotExist:
            return False


class GroupModeratorPermission(BasePermission):
    def has_permission(self, request, view):
        group_id = view.kwargs.get('group_id')
        try:
            membership = GroupMembership.objects.get(user=request.user, group_id=group_id)
            return membership.can_edit_roles()
        except GroupMembership.DoesNotExist:
            return False


class GroupMembersView(APIView):
    permission_classes = [IsAuthenticated, GroupMemberPermission]

    def get(self, request, group_id):
        get_object_or_404(UserGroup, id=group_id)
        memberships = GroupMembership.objects.filter(group_id=group_id).select_related('user')
        data = [
            {
                'user_id': m.user.id, 'email': m.user.email, 'username': m.user.username,
                'first_name': m.user.first_name, 'last_name': m.user.last_name, 'role': m.role,
            }
            for m in memberships
        ]
        return Response(data)


class GroupMemberRoleView(APIView):
    permission_classes = [IsAuthenticated, GroupModeratorPermission]

    def patch(self, request, group_id, user_id):
        membership = get_object_or_404(GroupMembership, group_id=group_id, user_id=user_id)
        role = request.data.get('role')
        if role not in dict(GroupMembership.ROLE_CHOICES):
            return Response({'role': ['Invalid role.']}, status=400)
        requester = GroupMembership.objects.get(user=request.user, group_id=group_id)
        if requester.role == 'moderator' and (role == 'admin' or membership.role == 'admin'):
            return Response({'detail': 'Moderators cannot assign or modify admin roles.'}, status=403)
        membership.role = role
        membership.save(update_fields=['role'])
        return Response({'user_id': user_id, 'role': role})


class GroupInviteListView(APIView):
    permission_classes = [IsAuthenticated, GroupAdminPermission]

    def get(self, request, group_id):
        get_object_or_404(UserGroup, id=group_id)
        invites = GroupInvite.objects.filter(group_id=group_id).select_related('invited_by', 'used_by')
        return Response(GroupInviteSerializer(invites, many=True).data)


class GroupEmailInviteView(APIView):
    permission_classes = [IsAuthenticated, GroupAdminPermission]

    def post(self, request, group_id):
        get_object_or_404(UserGroup, id=group_id)
        serializer = EmailInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        invite = GroupInvite.objects.create(
            email=data['email'],
            group_id=group_id,
            role=data['role'],
            invited_by=request.user,
            invite_type='email',
            expires_at=data.get('expires_at'),
        )
        return Response(GroupInviteSerializer(invite).data, status=201)


class GroupBulkInviteView(APIView):
    permission_classes = [IsAuthenticated, GroupAdminPermission]

    def post(self, request, group_id):
        get_object_or_404(UserGroup, id=group_id)
        serializer = BulkInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        bulk_id = uuid.uuid4()
        GroupInvite.objects.bulk_create([
            GroupInvite(
                email=email,
                group_id=group_id,
                role=data['role'],
                invited_by=request.user,
                invite_type='bulk',
                expires_at=data.get('expires_at'),
                bulk_id=bulk_id,
            )
            for email in data['emails']
        ])
        created = GroupInvite.objects.filter(bulk_id=bulk_id).select_related('invited_by', 'used_by')
        return Response(GroupInviteSerializer(created, many=True).data, status=201)


class GroupQrInviteView(APIView):
    permission_classes = [IsAuthenticated, GroupAdminPermission]

    def post(self, request, group_id):
        get_object_or_404(UserGroup, id=group_id)
        serializer = QrInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        invite = GroupInvite.objects.create(
            group_id=group_id,
            role=data['role'],
            invited_by=request.user,
            invite_type='qr',
            expires_at=data.get('expires_at'),
        )
        return Response(GroupInviteSerializer(invite).data, status=201)


class GroupInviteRevokeView(APIView):
    permission_classes = [IsAuthenticated, GroupAdminPermission]

    def post(self, request, group_id, invite_id):
        invite = get_object_or_404(GroupInvite, id=invite_id, group_id=group_id)
        if invite.used:
            return Response({'detail': 'Invite already used.'}, status=400)
        if invite.revoked:
            return Response({'detail': 'Invite already revoked.'}, status=400)
        invite.revoked = True
        invite.save(update_fields=['revoked'])
        return Response(GroupInviteSerializer(invite).data)


class GroupQrImageView(APIView):
    permission_classes = [IsAuthenticated, GroupAdminPermission]

    def get(self, request, group_id, token):
        invite = get_object_or_404(GroupInvite, token=token, group_id=group_id, invite_type='qr')

        site_url = getattr(settings, 'SITE_URL', None) or request.build_absolute_uri('/')
        join_url = f"{site_url.rstrip('/')}/join/{token}"

        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(join_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color='black', back_color='white')

        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)

        from django.http import HttpResponse
        return HttpResponse(buffer.read(), content_type='image/png')


class JoinView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return []

    def _get_valid_invite(self, token):
        invite = get_object_or_404(GroupInvite, token=token)
        if not invite.is_valid():
            return None, Response({'detail': 'Invite is no longer valid.'}, status=410)
        return invite, None

    def get(self, request, token):
        invite, error = self._get_valid_invite(token)
        if error:
            return error
        return Response(JoinInfoSerializer(invite).data)

    def post(self, request, token):
        invite, error = self._get_valid_invite(token)
        if error:
            return error

        if invite.invite_type in ('email', 'bulk') and invite.email:
            if request.user.email != invite.email:
                return Response({'detail': 'This invite is for a different email address.'}, status=403)

        if GroupMembership.objects.filter(user=request.user, group=invite.group).exists():
            return Response({'detail': 'Already a member of this group.'}, status=400)

        GroupMembership.objects.create(
            user=request.user,
            group=invite.group,
            role=invite.role,
        )
        invite.used = True
        invite.used_by = request.user
        invite.used_at = timezone.now()
        invite.save(update_fields=['used', 'used_by', 'used_at'])

        return Response({'detail': 'Successfully joined the group.'})


def _apply_pending_invites(user):
    pending = GroupInvite.objects.filter(
        email=user.email,
        used=False,
        revoked=False,
    ).filter(
        models.Q(expires_at__isnull=True) | models.Q(expires_at__gt=timezone.now())
    ).select_related('group')

    for invite in pending:
        if not GroupMembership.objects.filter(user=user, group=invite.group).exists():
            GroupMembership.objects.create(
                user=user,
                group=invite.group,
                role=invite.role,
            )
        invite.used = True
        invite.used_by = user
        invite.used_at = timezone.now()
        invite.save(update_fields=['used', 'used_by', 'used_at'])


class TokenObtainPairView(BaseTokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            email = request.data.get('email')
            if email:
                try:
                    user = User.objects.get(email=email)
                    _apply_pending_invites(user)
                except User.DoesNotExist:
                    pass
        return response
