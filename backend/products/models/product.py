from django.db import models

from .brand import Brand
from .category import Category
from .flavor import Flavor
from .user import User, UserGroup


class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, related_name='products', null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    variant = models.CharField(max_length=64, blank=True)
    flavors = models.ManyToManyField(Flavor, blank=True)
    groups = models.ManyToManyField(UserGroup, blank=True, related_name='products')

    def __str__(self):
        return f"{self.category.name} - {self.brand} - {self.variant}"
