from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
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