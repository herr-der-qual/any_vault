from rest_framework import permissions

from users.models import GroupMembership


class IsGroupMemberOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if obj.group is None:
            return False
        membership = GroupMembership.objects.filter(user=request.user, group=obj.group).first()
        return membership is not None and membership.can_edit_others_data()


class ProductPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if request.user == obj.user:
            return True

        membership = GroupMembership.objects.filter(
            user=request.user,
            group__in=obj.groups.all()
        ).first()
        return membership is not None and membership.can_edit_others_data()


class CanEditPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        user = request.user

        if user == obj.user:
            return True

        if user == obj.product.user:
            return True

        if obj.product.groups.filter(members=user).exists():
            membership = GroupMembership.objects.filter(
                user=user,
                group__in=obj.product.groups.all()
            ).first()
            if membership and membership.can_edit_others_data():
                return True

        return False
