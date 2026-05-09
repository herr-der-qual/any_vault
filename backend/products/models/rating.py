from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

from products.models.product import Product
from products.models.user import User


class Rating(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='ratings')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ratings')
    value = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    class Meta:
        unique_together = ('product', 'user')

    def __str__(self):
        return f"{self.value} stars by {self.user}"