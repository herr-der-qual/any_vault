from django.db import models

from users.models import User
from .color import Color


class Flavor(models.Model):
    class Meta:
        unique_together = ['name', 'user']
        ordering = ['name']

    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE)
    name = models.CharField(unique=True, max_length=32)
    color = models.ForeignKey(Color, null=True, blank=True, on_delete=models.SET_NULL, related_name='flavors')

    def __str__(self):
        return self.name
