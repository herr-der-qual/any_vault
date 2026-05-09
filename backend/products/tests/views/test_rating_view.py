from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ...models.category import Category
from ...models.product import Product
from ...models.rating import Rating
from ...models.user import User


class ProductRatingViewTestCase(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Energy Drink")
        self.user = User.objects.create(telegram_id=123456789, username="testuser")
        self.product = Product.objects.create(
            category=self.category,
            user=self.user,
            variant='Test Product'
        )
    
    def test_add_rating_success(self):
        data = {
            'product_id': self.product.id,
            'telegram_id': 123456789,
            'rating': 8
        }
        
        url = reverse('product-rating')
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Rating.objects.count(), 1)
        
        rating = Rating.objects.first()
        self.assertEqual(rating.value, 8)
        self.assertEqual(rating.product, self.product)
        self.assertEqual(rating.user, self.user)
    
    def test_update_rating_success(self):
        rating = Rating.objects.create(
            product=self.product,
            user=self.user,
            value=5
        )
        
        data = {
            'product_id': self.product.id,
            'telegram_id': 123456789,
            'rating': 9
        }
        
        url = reverse('product-rating')
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Rating.objects.count(), 1)
        
        rating.refresh_from_db()
        self.assertEqual(rating.value, 9)
    
    def test_add_rating_missing_fields(self):
        data = {
            'product_id': self.product.id,
            'telegram_id': 123456789
        }
        
        url = reverse('product-rating')
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_rating_invalid_product(self):
        data = {
            'product_id': 999,
            'telegram_id': 123456789,
            'rating': 8
        }
        
        url = reverse('product-rating')
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, 400)
    
    def test_add_rating_invalid_user(self):
        data = {
            'product_id': self.product.id,
            'telegram_id': 999999999,
            'rating': 8
        }
        
        url = reverse('product-rating')
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, 400)
