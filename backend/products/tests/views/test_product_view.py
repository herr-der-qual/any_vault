import unittest

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ...models.brand import Brand
from ...models.category import Category
from ...models.flavor import Flavor
from ...models.product import Product
from ...models.user import User, UserGroup


class CreateProductTestCase(APITestCase):
    def setUp(self):
        self.url = reverse('product-list')
        self.full_data = {
            'category': 'Energy Drink',
            'brand': 'Monster',
            'variant': 'Ultra Watermelon',
            'telegram_id': 111111111,
            'username': 'arina',
            'flavors': ['Watermelon', 'Original'],
            'groups': ['Family'],
            'ratings': [
                {'telegram_id': 111111111, 'rating': 4},
                {'telegram_id': 222222222, 'rating': 3},
            ],
            'comments': [
                {'telegram_id': 111111111, 'comment': 'Pretty good'},
                {'telegram_id': 222222222, 'comment': 'Too sweet'},
            ],
        }

    def test_success(self):
        response = self.client.post(self.url, self.full_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        product = Product.objects.first()
        self.assertEqual(product.category.name, 'Energy Drink')
        self.assertEqual(product.brand.name, 'Monster')
        self.assertEqual(product.variant, 'Ultra Watermelon')
        self.assertEqual(product.user.telegram_id, 111111111)
        self.assertEqual(product.flavors.count(), 2)
        self.assertEqual(product.groups.count(), 1)
        self.assertEqual(product.ratings.count(), 2)
        self.assertEqual(product.comments.count(), 2)

    def test_success__ratings_only(self):
        data = {
            'category': 'Energy Drink',
            'telegram_id': 111111111,
            'ratings': [{'telegram_id': 111111111, 'rating': 5}],
        }

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['ratings'][0]['value'], 5)
        product = Product.objects.first()
        self.assertEqual(product.ratings.count(), 1)
        self.assertEqual(product.comments.count(), 0)

    def test_success__comments_only(self):
        data = {
            'category': 'Energy Drink',
            'telegram_id': 111111111,
            'comments': [{'telegram_id': 111111111, 'comment': 'Nice'}],
        }

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['comments'][0]['text'], 'Nice')
        product = Product.objects.first()
        self.assertEqual(product.ratings.count(), 0)
        self.assertEqual(product.comments.count(), 1)

    def test_success__same_category_not_duplicated(self):
        Category.objects.create(name='Energy Drink')

        self.client.post(self.url, self.full_data, format='json')

        self.assertEqual(Category.objects.filter(name='Energy Drink').count(), 1)

    def test_success__same_brand_not_duplicated(self):
        Brand.objects.create(name='Monster')

        self.client.post(self.url, self.full_data, format='json')

        self.assertEqual(Brand.objects.filter(name='Monster').count(), 1)

    def test_success__same_user_not_duplicated(self):
        User.objects.create(telegram_id=111111111, username='old_name')

        self.client.post(self.url, self.full_data, format='json')

        self.assertEqual(User.objects.filter(telegram_id=111111111).count(), 1)

    def test_success__missing_non_required_fields(self):
        data = {
            'category': 'Energy Drink',
            'telegram_id': 111111111,
        }

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        product = Product.objects.first()
        self.assertIsNone(product.brand)
        self.assertEqual(product.variant, '')
        self.assertEqual(product.flavors.count(), 0)
        self.assertEqual(product.groups.count(), 0)
        self.assertEqual(product.ratings.count(), 0)
        self.assertEqual(product.comments.count(), 0)

    def test_failure__missing_required_fields(self):
        # missing: category
        response = self.client.post(self.url, {'telegram_id': 111111111}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('category', response.data)

        # missing: telegram_id
        response = self.client.post(self.url, {'category': 'Energy Drink'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('telegram_id', response.data)

        # missing: category, telegram_id
        response = self.client.post(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.assertEqual(Product.objects.count(), 0)

    @unittest.skip("Access control not implemented — API uses AllowAny permission")
    def test_failure__access_denied(self):
        pass


class ProductViewTestCase(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Energy Drink")
        self.user = User.objects.create(telegram_id=123456789, username="testuser")
        self.flavor = Flavor.objects.create(name="Original")
        self.group = UserGroup.objects.create(name="Family")

        self.product_data = {
            'category': 'Energy Drink',
            'variant': 'Monster Energy',
            'telegram_id': 123456789,
            'username': 'testuser',
            'flavors': ['Original', 'Zero Sugar'],
            'groups': ['Family', 'Friends']
        }

    def test_create_product_success(self):
        url = reverse('product-list')
        response = self.client.post(url, self.product_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 1)

        product = Product.objects.first()
        self.assertEqual(product.category.name, 'Energy Drink')
        self.assertEqual(product.variant, 'Monster Energy')
        self.assertEqual(product.user.telegram_id, 123456789)
        self.assertEqual(product.flavors.count(), 2)
        self.assertEqual(product.groups.count(), 2)

    def test_create_product_missing_category(self):
        data = self.product_data.copy()
        del data['category']

        url = reverse('product-list')
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Product.objects.count(), 0)

    def test_create_product_missing_telegram_id(self):
        data = self.product_data.copy()
        del data['telegram_id']

        url = reverse('product-list')
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Product.objects.count(), 0)

    def test_create_product_auto_create_related_objects(self):
        data = {
            'category': 'New Category',
            'variant': 'New Variant',
            'telegram_id': 987654321,
            'flavors': ['New Flavor'],
            'groups': ['New Group']
        }

        url = reverse('product-list')
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertTrue(Category.objects.filter(name='New Category').exists())
        self.assertTrue(Flavor.objects.filter(name='New Flavor').exists())
        self.assertTrue(UserGroup.objects.filter(name='New Group').exists())
        self.assertTrue(User.objects.filter(telegram_id=987654321).exists())

    def test_get_products_empty(self):
        url = reverse('product-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_get_products_with_data(self):
        product = Product.objects.create(
            category=self.category,
            user=self.user,
            variant='Test Variant'
        )
        product.flavors.add(self.flavor)
        product.groups.add(self.group)

        url = reverse('product-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        product_data = response.data[0]
        self.assertEqual(product_data['variant'], 'Test Variant')
        self.assertEqual(product_data['category'], 'Energy Drink')
        self.assertEqual(len(product_data['flavors']), 1)
        self.assertEqual(len(product_data['groups']), 1)

    def test_get_products_filter_by_category(self):
        category2 = Category.objects.create(name="Soda")
        product1 = Product.objects.create(category=self.category, user=self.user, variant="Energy")
        product2 = Product.objects.create(category=category2, user=self.user, variant="Soda")

        url = reverse('product-list')
        response = self.client.get(url, {'category': 'Energy'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['variant'], 'Energy')

    def test_get_products_filter_by_group(self):
        group2 = UserGroup.objects.create(name="Work")
        product1 = Product.objects.create(category=self.category, user=self.user, variant="Product1")
        product2 = Product.objects.create(category=self.category, user=self.user, variant="Product2")

        product1.groups.add(self.group)
        product2.groups.add(group2)

        url = reverse('product-list')
        response = self.client.get(url, {'group': 'Family'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['variant'], 'Product1')

    def test_update_product_success(self):
        product = Product.objects.create(
            category=self.category,
            user=self.user,
            variant='Original Variant'
        )

        update_data = {
            'category': 'Updated Category',
            'variant': 'Updated Variant',
            'flavors': ['New Flavor'],
            'groups': ['New Group']
        }

        url = reverse('product-detail', kwargs={'product_id': product.id})
        response = self.client.put(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        product.refresh_from_db()
        self.assertEqual(product.category.name, 'Updated Category')
        self.assertEqual(product.variant, 'Updated Variant')
        self.assertEqual(product.flavors.count(), 1)
        self.assertEqual(product.groups.count(), 1)

    def test_update_product_not_found(self):
        update_data = {'variant': 'Updated Variant'}

        url = reverse('product-detail', kwargs={'product_id': 999})
        response = self.client.put(url, update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_product_success(self):
        product = Product.objects.create(
            category=self.category,
            user=self.user,
            variant='To Delete'
        )

        url = reverse('product-detail', kwargs={'product_id': product.id})
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Product.objects.count(), 0)

    def test_delete_product_not_found(self):
        url = reverse('product-detail', kwargs={'product_id': 999})
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
