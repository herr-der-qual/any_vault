from django.db import models

from users.models import User


class Flavor(models.Model):
    class Meta:
        unique_together = ['name', 'user']
        ordering = ['name']

    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE)
    name = models.CharField(unique=True, max_length=32)
    color = models.CharField(max_length=16, blank=True, default='')

    def __str__(self):
        return self.name
