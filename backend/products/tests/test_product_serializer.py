from unittest.mock import MagicMock

from django.test import TestCase

from users.models import User, UserGroup
from products.models.brand import Brand
from products.models.category import Category
from products.models.color import Color
from products.models.flavor import Flavor
from products.models.product import Product
from products.serializers.product import ProductCreateSerializer, ProductListSerializer


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


class ProductListSerializerFlavorsTestCase(TestCase):
    def setUp(self):
        self.user = make_user()
        self.category = Category.objects.create(name='Energy Drink')
        self.color = Color.objects.create(name='Green', primary='#a5d6a7', secondary='#000000')

    def _make_product(self, flavors):
        product = Product.objects.create(category=self.category, user=self.user)
        product.flavors.set(flavors)
        return product

    def _serialize(self, product):
        return ProductListSerializer(product).data

    def test_flavor_without_color__returns_null(self):
        flavor = Flavor.objects.create(name='Plain')
        product = self._make_product([flavor])

        data = self._serialize(product)

        self.assertEqual(data['flavors'][0]['name'], 'Plain')
        self.assertIsNone(data['flavors'][0]['color'])

    def test_flavor_with_color__returns_color_object(self):
        flavor = Flavor.objects.create(name='Berry', color=self.color)
        product = self._make_product([flavor])

        data = self._serialize(product)

        color_data = data['flavors'][0]['color']
        self.assertIsNotNone(color_data)
        self.assertEqual(color_data['id'], self.color.id)
        self.assertEqual(color_data['primary'], '#a5d6a7')
        self.assertEqual(color_data['secondary'], '#000000')

    def test_multiple_flavors__mixed_colors(self):
        flavor_with = Flavor.objects.create(name='Colored', color=self.color)
        flavor_without = Flavor.objects.create(name='Plain')
        product = self._make_product([flavor_with, flavor_without])

        data = self._serialize(product)

        flavors_by_name = {f['name']: f for f in data['flavors']}
        self.assertIsNotNone(flavors_by_name['Colored']['color'])
        self.assertIsNone(flavors_by_name['Plain']['color'])

    def test_no_flavors__returns_empty_list(self):
        product = self._make_product([])

        data = self._serialize(product)

        self.assertEqual(data['flavors'], [])
