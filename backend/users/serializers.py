from rest_framework import serializers

from .models import GroupMembership, GroupInvite, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'is_staff']


class GroupInviteSerializer(serializers.ModelSerializer):
    invited_by_email = serializers.EmailField(source='invited_by.email', read_only=True)
    used_by_email = serializers.EmailField(source='used_by.email', read_only=True, allow_null=True)
    is_valid = serializers.SerializerMethodField()

    class Meta:
        model = GroupInvite
        fields = [
            'id', 'email', 'invite_type', 'role', 'invited_by_email',
            'token', 'expires_at', 'used', 'used_by_email', 'used_at',
            'bulk_id', 'revoked', 'created_at', 'is_valid',
        ]

    def get_is_valid(self, obj):
        return obj.is_valid()


class EmailInviteSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=GroupMembership.ROLE_CHOICES, default='view_only')
    expires_at = serializers.DateTimeField(required=False, allow_null=True)


class BulkInviteSerializer(serializers.Serializer):
    emails = serializers.ListField(child=serializers.EmailField(), min_length=1)
    role = serializers.ChoiceField(choices=GroupMembership.ROLE_CHOICES, default='view_only')
    expires_at = serializers.DateTimeField(required=False, allow_null=True)


class QrInviteSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=GroupMembership.ROLE_CHOICES, default='view_only')
    expires_at = serializers.DateTimeField(required=False, allow_null=True)


class JoinInfoSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source='group.name', read_only=True)
    invited_by_email = serializers.EmailField(source='invited_by.email', read_only=True)

    class Meta:
        model = GroupInvite
        fields = ['token', 'group_name', 'role', 'invited_by_email', 'expires_at', 'invite_type']
