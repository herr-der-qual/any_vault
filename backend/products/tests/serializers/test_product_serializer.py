from django.test import TestCase

from ...models.brand import Brand
from ...models.category import Category
from ...models.flavor import Flavor
from ...models.product import Product
from ...models.user import User
from ...serializers.product import ProductSerializer


class ProductSerializerCreateValidationTestCase(TestCase):
    def setUp(self):
        self.valid_data = {
            'category': 'Energy Drink',
            'brand': 'Monster',
            'variant': 'Monster Ultra',
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

    def test_valid__all_fields(self):
        serializer = ProductSerializer(data=self.valid_data)

        self.assertTrue(serializer.is_valid())

    def test_valid__required_fields_only(self):
        data = {
            'category': 'Energy Drink',
            'telegram_id': 111111111,
        }

        serializer = ProductSerializer(data=data)

        self.assertTrue(serializer.is_valid())

    def test_invalid__missing_category(self):
        data = {**self.valid_data}
        del data['category']

        serializer = ProductSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn('category', serializer.errors)

    def test_invalid__missing_telegram_id(self):
        data = {**self.valid_data}
        del data['telegram_id']

        serializer = ProductSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn('telegram_id', serializer.errors)

    def test_invalid__empty_category(self):
        data = {**self.valid_data, 'category': ''}

        serializer = ProductSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn('category', serializer.errors)


class ProductSerializerCreateTestCase(TestCase):
    def setUp(self):
        self.valid_data = {
            'category': 'Energy Drink',
            'brand': 'Monster',
            'variant': 'Monster Ultra',
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

    def _save(self, data):
        serializer = ProductSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return serializer.save()

    def test_create__product_with_all_related_objects(self):
        product = self._save(self.valid_data)

        self.assertEqual(product.category.name, 'Energy Drink')
        self.assertEqual(product.brand.name, 'Monster')
        self.assertEqual(product.variant, 'Monster Ultra')
        self.assertEqual(product.user.telegram_id, 111111111)
        self.assertEqual(product.flavors.count(), 2)
        self.assertEqual(product.groups.count(), 1)
        self.assertEqual(product.ratings.count(), 2)
        self.assertEqual(product.comments.count(), 2)

    def test_create__reuses_existing_category(self):
        Category.objects.create(name='Energy Drink')

        self._save(self.valid_data)

        self.assertEqual(Category.objects.filter(name='Energy Drink').count(), 1)

    def test_create__reuses_existing_brand(self):
        Brand.objects.create(name='Monster')

        self._save(self.valid_data)

        self.assertEqual(Brand.objects.filter(name='Monster').count(), 1)

    def test_create__without_brand__brand_is_null(self):
        data = {**self.valid_data}
        del data['brand']

        product = self._save(data)

        self.assertIsNone(product.brand)

    def test_create__reuses_existing_user(self):
        User.objects.create(telegram_id=111111111, username='old_name')

        self._save(self.valid_data)

        self.assertEqual(User.objects.filter(telegram_id=111111111).count(), 1)

    def test_create__deduplicates_flavors(self):
        data = {**self.valid_data, 'flavors': ['Cola', 'Cola', 'Cola']}

        product = self._save(data)

        self.assertEqual(product.flavors.count(), 1)

    def test_create__skips_empty_flavor_strings(self):
        data = {**self.valid_data, 'flavors': ['Watermelon', '', 'Original']}

        product = self._save(data)

        self.assertEqual(product.flavors.count(), 2)


class ProductSerializerUpdateTestCase(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Energy Drink')
        self.user = User.objects.create(telegram_id=111111111)
        self.flavor = Flavor.objects.create(name='Original')
        self.product = Product.objects.create(
            category=self.category,
            user=self.user,
            variant='Monster Ultra',
        )
        self.product.flavors.add(self.flavor)

    def _update(self, data):
        serializer = ProductSerializer(self.product, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        return serializer.save()

    def test_update__changes_category(self):
        product = self._update({'category': 'Soda'})

        self.assertEqual(product.category.name, 'Soda')

    def test_update__changes_brand(self):
        product = self._update({'brand': 'Pepsi'})

        self.assertEqual(product.brand.name, 'Pepsi')

    def test_update__replaces_flavors(self):
        product = self._update({'flavors': ['Cola', 'Lemon']})

        flavor_names = set(product.flavors.values_list('name', flat=True))
        self.assertEqual(flavor_names, {'Cola', 'Lemon'})
        self.assertNotIn('Original', flavor_names)

    def test_update__ignores_telegram_id(self):
        product = self._update({'telegram_id': 999999999, 'category': 'Energy Drink'})

        self.assertEqual(product.user, self.user)
