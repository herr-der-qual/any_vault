from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, UserGroup, GroupMembership, GroupInvite


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('id', 'email', 'first_name', 'last_name', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile', {'fields': ('email_code', 'reset_token', 'reset_token_expires')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )


class GroupMembershipInline(admin.TabularInline):
    model = GroupMembership
    extra = 0
    fields = ('user', 'role', 'joined_at')
    readonly_fields = ('joined_at',)


@admin.register(UserGroup)
class UserGroupAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'member_count')
    search_fields = ('name',)
    inlines = [GroupMembershipInline]

    @admin.display(description='Members')
    def member_count(self, obj):
        return obj.members.count()


@admin.register(GroupMembership)
class GroupMembershipAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'group', 'role', 'joined_at')
    list_select_related = ('user', 'group')
    list_filter = ('role', 'group')
    search_fields = ('user__email', 'group__name')
    readonly_fields = ('joined_at', 'updated_at')


@admin.register(GroupInvite)
class GroupInviteAdmin(admin.ModelAdmin):
    list_display = ('id', 'invite_type', 'email', 'group', 'role', 'invited_by', 'used', 'revoked', 'created_at')
    list_filter = ('invite_type', 'role', 'used', 'revoked', 'group')
    search_fields = ('email', 'group__name', 'invited_by__email')
    readonly_fields = ('token', 'bulk_id', 'used_at', 'created_at')
