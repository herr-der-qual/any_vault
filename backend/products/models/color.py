from django.db import models


class Color(models.Model):
    name = models.CharField(max_length=64)
    primary = models.CharField(max_length=7)
    secondary = models.CharField(max_length=7)

    def __str__(self):
        return self.name
