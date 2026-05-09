from django.db import models


class User(models.Model):
    telegram_id = models.BigIntegerField(unique=True)
    username = models.CharField(max_length=32, blank=True, null=True)
    ROLE_CHOICES = (
        ('admin', 'admin'),
        ('user', 'user')
    )
    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default='user')

    def __str__(self):
        return f"User {self.telegram_id}" + (f" (@{self.username})" if self.username else "")


class UserGroup(models.Model):
    name = models.CharField(max_length=32)
    members = models.ManyToManyField(User, related_name='groups')

    def __str__(self):
        return self.name
