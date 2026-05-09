from django.db import models

from products.models.product import Product
from products.models.user import User


class Comment(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField(max_length=500)

    def __str__(self):
        return f"Comment by {self.user} on {self.product}"
