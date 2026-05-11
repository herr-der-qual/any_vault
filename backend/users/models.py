import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    email = models.EmailField(unique=True)
    email_code = models.CharField(max_length=6, blank=True)
    reset_token = models.CharField(max_length=64, blank=True)
    reset_token_expires = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.email


class UserGroup(models.Model):
    name = models.CharField(max_length=32, unique=True)
    description = models.TextField(blank=True)
    members = models.ManyToManyField(User, through='GroupMembership', related_name='user_groups')

    def __str__(self):
        return self.name


class GroupMembership(models.Model):
    ROLE_CHOICES = (
        ('admin', 'Admin'),          # Can edit roles and others data
        ('moderator', 'Moderator'),  # Can edit others data
        ('view_only', 'View Only'),  # Can edit only their own data
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='memberships')
    group = models.ForeignKey(UserGroup, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='view_only')

    joined_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'group']
        ordering = ['-joined_at']

    def __str__(self):
        return f"{self.user.email} - {self.group.name} ({self.role})"

    def can_edit_roles(self):
        return self.role == 'admin'

    def can_edit_user_data(self, target_user):
        if self.user == target_user:
            return True
        return self.can_edit_others_data()

    def can_edit_others_data(self):
        return self.role in ['admin', 'moderator']

    def can_manage_group(self):
        return self.role == 'admin'

    def save(self, *args, **kwargs):
        if not self.pk and not self.group.memberships.exists():
            self.role = 'admin'
        super().save(*args, **kwargs)


class GroupInvite(models.Model):
    INVITE_TYPE_CHOICES = (
        ('email', 'Email'),
        ('bulk', 'Bulk'),
        ('qr', 'QR'),
    )

    email = models.EmailField(blank=True)
    group = models.ForeignKey(UserGroup, on_delete=models.CASCADE, related_name='invites')
    role = models.CharField(max_length=20, choices=GroupMembership.ROLE_CHOICES, default='view_only')
    invited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='sent_invites')
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    invite_type = models.CharField(max_length=10, choices=INVITE_TYPE_CHOICES, default='email')
    expires_at = models.DateTimeField(null=True, blank=True)
    used = models.BooleanField(default=False)
    used_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='used_invites')
    used_at = models.DateTimeField(null=True, blank=True)
    bulk_id = models.UUIDField(null=True, blank=True, db_index=True)
    revoked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.invite_type} invite to {self.group.name} ({self.token})"

    def is_valid(self):
        if self.used or self.revoked:
            return False
        if self.expires_at and self.expires_at < timezone.now():
            return False
        return True