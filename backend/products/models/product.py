from django.db import models

from users.models import User, UserGroup
from .brand import Brand
from .category import Category
from .flavor import Flavor


class Product(models.Model):
    class Meta:
        ordering = ['variant']
        unique_together = ['variant', 'brand', 'user']

    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, related_name='products', null=True, blank=True)
    variant = models.CharField(max_length=64, blank=True)
    flavors = models.ManyToManyField(Flavor, related_name='products')
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='products/', blank=True, null=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    groups = models.ManyToManyField(UserGroup, related_name='visible_products')


    def __str__(self):
        return f"{self.category.name} - {self.brand} - {self.variant}"
