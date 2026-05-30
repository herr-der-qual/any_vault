from django.db import models

from users.models import UserGroup


class Category(models.Model):
    class Meta:
        unique_together = ['name', 'group']
        ordering = ['name']

    group = models.ForeignKey(UserGroup, null=True, blank=True, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=32)

    def __str__(self):
        return self.name
