from django.db import models

from users.models import User, UserGroup


class TableView(models.Model):
    name = models.CharField(max_length=100)
    group = models.ForeignKey(UserGroup, on_delete=models.CASCADE, related_name='table_views')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='table_views')
    config = models.JSONField()
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.group.name})"
