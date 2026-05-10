from unittest.mock import MagicMock

from django.test import TestCase

from users.models import User, UserGroup
from products.models.brand import Brand
from products.models.category import Category
from products.models.flavor import Flavor
from products.models.product import Product
from products.serializers.product import ProductCreateSerializer


def make_context(user):
    request = MagicMock()
    request.user = user
    return {'request': request}


def make_user(**kwargs):
    defaults = {'username': 'testuser', 'email': 'test@example.com', 'password': 'pass'}
    defaults.update(kwargs)
    return User.objects.create_user(**defaults)


class ProductCreateSerializerValidationTestCase(TestCase):
    def setUp(self):
        self.user = make_user()
        self.brand = Brand.objects.create(name='Monster', user=self.user)
        self.category = Category.objects.create(name='Energy Drink', user=self.user)
        self.flavor1 = Flavor.objects.create(name='Watermelon')
        self.flavor2 = Flavor.objects.create(name='Original')
        self.group = UserGroup.objects.create(name='Family')

        self.valid_data = {
            'category': self.category.id,
            'brand': self.brand.id,
            'variant': 'Monster Ultra',
            'flavors': [self.flavor1.id, self.flavor2.id],
            'groups': [self.group.id],
        }

    def test_valid__all_fields(self):
        serializer = ProductCreateSerializer(data=self.valid_data, context=make_context(self.user))

        self.assertTrue(serializer.is_valid())

    def test_valid__required_fields_only(self):
        serializer = ProductCreateSerializer(
            data={'category': self.category.id},
            context=make_context(self.user),
        )

        self.assertTrue(serializer.is_valid())

    def test_invalid__missing_category(self):
        data = {**self.valid_data}
        del data['category']

        serializer = ProductCreateSerializer(data=data, context=make_context(self.user))

        self.assertFalse(serializer.is_valid())
        self.assertIn('category', serializer.errors)

    def test_invalid__nonexistent_category(self):
        serializer = ProductCreateSerializer(
            data={**self.valid_data, 'category': 99999},
            context=make_context(self.user),
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn('category', serializer.errors)


class ProductCreateSerializerCreateTestCase(TestCase):
    def setUp(self):
        self.user = make_user()
        self.brand = Brand.objects.create(name='Monster', user=self.user)
        self.category = Category.objects.create(name='Energy Drink', user=self.user)
        self.flavor1 = Flavor.objects.create(name='Watermelon')
        self.flavor2 = Flavor.objects.create(name='Original')
        self.group = UserGroup.objects.create(name='Family')

        self.valid_data = {
            'category': self.category.id,
            'brand': self.brand.id,
            'variant': 'Monster Ultra',
            'flavors': [self.flavor1.id, self.flavor2.id],
            'groups': [self.group.id],
        }

    def _save(self, data, user=None):
        serializer = ProductCreateSerializer(data=data, context=make_context(user or self.user))
        serializer.is_valid(raise_exception=True)
        return serializer.save()

    def test_create__sets_all_fields(self):
        product = self._save(self.valid_data)

        self.assertEqual(product.category, self.category)
        self.assertEqual(product.brand, self.brand)
        self.assertEqual(product.variant, 'Monster Ultra')
        self.assertEqual(product.user, self.user)
        self.assertEqual(product.flavors.count(), 2)
        self.assertEqual(product.groups.count(), 1)

    def test_create__without_brand__brand_is_null(self):
        data = {**self.valid_data}
        del data['brand']

        product = self._save(data)

        self.assertIsNone(product.brand)

    def test_create__without_flavors__flavors_empty(self):
        data = {**self.valid_data}
        del data['flavors']

        product = self._save(data)

        self.assertEqual(product.flavors.count(), 0)


class ProductCreateSerializerUpdateTestCase(TestCase):
    def setUp(self):
        self.user = make_user()
        self.category = Category.objects.create(name='Energy Drink')
        self.new_category = Category.objects.create(name='Soda')
        self.flavor = Flavor.objects.create(name='Original')
        self.new_flavor1 = Flavor.objects.create(name='Cola')
        self.new_flavor2 = Flavor.objects.create(name='Lemon')
        self.product = Product.objects.create(
            category=self.category,
            user=self.user,
            variant='Monster Ultra',
        )
        self.product.flavors.add(self.flavor)

    def _update(self, data):
        serializer = ProductCreateSerializer(
            self.product, data=data, partial=True, context=make_context(self.user)
        )
        serializer.is_valid(raise_exception=True)
        return serializer.save()

    def test_update__changes_category(self):
        product = self._update({'category': self.new_category.id})

        self.assertEqual(product.category, self.new_category)

    def test_update__replaces_flavors(self):
        product = self._update({'flavors': [self.new_flavor1.id, self.new_flavor2.id]})

        flavor_names = set(product.flavors.values_list('name', flat=True))
        self.assertEqual(flavor_names, {'Cola', 'Lemon'})
        self.assertNotIn('Original', flavor_names)
