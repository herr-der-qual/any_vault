from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import reverse

from users.models import User, UserGroup
from products.models.brand import Brand
from products.models.category import Category
from products.models.flavor import Flavor
from products.models.product import Product


class ProductCreateTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='pass'
        )
        self.client.force_authenticate(user=self.user)

        self.brand = Brand.objects.create(name='Monster', user=self.user)
        self.category = Category.objects.create(name='Energy Drink', user=self.user)
        self.flavor1 = Flavor.objects.create(name='Watermelon')
        self.flavor2 = Flavor.objects.create(name='Original')
        self.flavor3 = Flavor.objects.create(name='Cherry')
        self.group = UserGroup.objects.create(name='Family')

        self.url = reverse('product-list')
        self.data = {
            'brand': self.brand.id,
            'category': self.category.id,
            'flavors': [self.flavor1.id, self.flavor2.id, self.flavor3.id],
            'variant': 'ultra blue',
            'groups': [self.group.id],
        }

    def test_create__returns_201(self):
        response = self.client.post(self.url, self.data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create__sets_correct_fields(self):
        response = self.client.post(self.url, self.data, format='json')

        product = Product.objects.get(id=response.data['id'])
        self.assertEqual(product.brand, self.brand)
        self.assertEqual(product.category, self.category)
        self.assertEqual(product.variant, 'ultra blue')
        self.assertEqual(product.flavors.count(), 3)
        self.assertEqual(product.groups.count(), 1)

    def test_create__sets_user_from_request(self):
        response = self.client.post(self.url, self.data, format='json')

        product = Product.objects.get(id=response.data['id'])
        self.assertEqual(product.user, self.user)

    def test_create__unauthenticated__returns_401(self):
        self.client.force_authenticate(user=None)

        response = self.client.post(self.url, self.data, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create__missing_category__returns_400(self):
        data = {**self.data}
        del data['category']

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('category', response.data)
