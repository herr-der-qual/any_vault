from django.db import models

from users.models import UserGroup
from .color import Color


class Flavor(models.Model):
    class Meta:
        unique_together = ['name', 'group']
        ordering = ['name']

    group = models.ForeignKey(UserGroup, null=True, blank=True, on_delete=models.CASCADE, related_name='flavors')
    name = models.CharField(max_length=32)
    color = models.ForeignKey(Color, null=True, blank=True, on_delete=models.SET_NULL, related_name='flavors')

    def __str__(self):
        return self.name
