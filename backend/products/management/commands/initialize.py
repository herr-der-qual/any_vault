import os

from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.contrib.auth import get_user_model

from users.models import UserGroup, GroupMembership
from products.models.category import Category
from products.models.brand import Brand
from products.models.flavor import Flavor
from products.models.product import Product
from products.models.rating import Rating
from products.models.comment import Comment


User = get_user_model()

SEED_DATA = [
    {
        'category': 'Energy Drink',
        'brand': 'Monster',
        'variant': 'Original',
        'flavors': ['Classic'],
        'ratings': [(None, 8), (None, 7)],
        'comments': [(None, 'Great taste, a bit too sweet. And so long comments here. I don`n know what to write here. So, elephants a good boys'), (None, 'Good energy boost')],
    },
    {
        'category': 'Energy Drink',
        'brand': 'Monster',
        'variant': 'Ultra White',
        'flavors': ['Citrus'],
        'ratings': [(None, 9), (None, 6)],
        'comments': [(None, 'Light and refreshing'), (None, 'Not sweet enough for me')],
    },
    {
        'category': 'Energy Drink',
        'brand': 'Red Bull',
        'variant': '',
        'flavors': ['Classic'],
        'ratings': [(None, 7), (None, 9)],
        'comments': [(None, 'Too small for the price'), (None, 'My daily go-to')],
    },
    {
        'category': 'Energy Drink',
        'brand': 'Red Bull',
        'variant': 'Watermelon',
        'flavors': ['Watermelon'],
        'ratings': [(None, 8), (None, 8)],
        'comments': [(None, 'Love the flavor'), (None, 'Surprisingly good')],
    },
    {
        'category': 'Energy Drink',
        'brand': 'Celsius',
        'variant': '',
        'flavors': ['Sparkling Orange'],
        'ratings': [(None, 9), (None, 7)],
        'comments': [(None, 'Best clean energy drink'), (None, 'Good but pricey')],
    },
    {
        'category': 'Energy Drink',
        'brand': 'Celsius',
        'variant': '',
        'flavors': ['Wild Berry'],
        'ratings': [(None, 8), (None, 9)],
        'comments': [(None, 'Delicious'), (None, 'My favorite Celsius flavor')],
    },
    {
        'category': 'Coffee',
        'brand': 'Starbucks',
        'variant': 'Doubleshot',
        'flavors': ['Espresso'],
        'ratings': [(None, 7), (None, 8)],
        'comments': [(None, 'Strong and smooth'), (None, 'Perfect for mornings')],
    },
    {
        'category': 'Coffee',
        'brand': 'Starbucks',
        'variant': 'Frappuccino',
        'flavors': ['Mocha', 'Vanilla'],
        'ratings': [(None, 6), (None, 9)],
        'comments': [(None, 'Too sugary for me'), (None, 'Dessert in a bottle')],
    },
    {
        'category': 'Soda',
        'brand': 'Coca-Cola',
        'variant': 'Zero Sugar',
        'flavors': ['Cola'],
        'ratings': [(None, 8), (None, 7)],
        'comments': [(None, 'Almost identical to regular'), (None, 'Decent zero-cal option')],
    },
    {
        'category': 'Soda',
        'brand': 'Pepsi',
        'variant': 'Max',
        'flavors': ['Cola'],
        'ratings': [(None, 7), (None, 8)],
        'comments': [(None, 'Sweeter than Coke Zero'), (None, 'Solid choice')],
    },
]


class Command(BaseCommand):
    help = 'Initialize database with superuser and basic data'

    def handle(self, *args, **options):
        self.stdout.write('Starting initialization...')

        # Superuser
        superuser = self._get_or_create_superuser()

        # Second user
        second_user = self._get_or_create_second_user()

        # Group
        group = self._get_or_create_group(superuser, second_user)

        # Colors
        call_command('create_colors')

        # Seed products
        self._seed_products(superuser, second_user, group)

        self.stdout.write(self.style.SUCCESS('Initialization complete'))

    def _get_or_create_superuser(self):
        if not User.objects.filter(is_superuser=True).exists():
            user = User.objects.create_superuser(
                username=os.getenv('DJANGO_SUPERUSER_USERNAME', 'admin'),
                email=os.getenv('DJANGO_SUPERUSER_EMAIL', 'admin@example.com'),
                password=os.getenv('DJANGO_SUPERUSER_PASSWORD', 'admin'),
            )
            self.stdout.write(self.style.SUCCESS('Superuser created'))
            return user
        else:
            self.stdout.write('Superuser already exists')
            return User.objects.filter(is_superuser=True).first()

    def _get_or_create_second_user(self):
        email = 'user2@example.com'
        if not User.objects.filter(email=email).exists():
            user = User.objects.create_user(
                username='user2',
                email=email,
                password='user2pass',
                first_name='Alex',
                last_name='Smith',
            )
            self.stdout.write(self.style.SUCCESS('Second user created'))
            return user
        else:
            self.stdout.write('Second user already exists')
            return User.objects.get(email=email)

    def _get_or_create_group(self, admin_user, member_user):
        group, created = UserGroup.objects.get_or_create(name='Tasters')
        if created:
            GroupMembership.objects.create(user=admin_user, group=group, role='admin')
            GroupMembership.objects.create(user=member_user, group=group, role='view_only')
            self.stdout.write(self.style.SUCCESS('Group "Tasters" created with both members'))
        else:
            self.stdout.write('Group "Tasters" already exists')
        return group

    def _seed_products(self, user1, user2, group):
        users = [user1, user2]

        if Product.objects.filter(groups=group).exists():
            self.stdout.write('Products already seeded')
            return

        for item in SEED_DATA:
            category, _ = Category.objects.get_or_create(name=item['category'], group=group)
            brand, _ = Brand.objects.get_or_create(name=item['brand'], group=group)
            flavors = [
                Flavor.objects.get_or_create(name=name, group=group)[0]
                for name in item['flavors']
            ]

            product = Product.objects.create(
                user=user1,
                category=category,
                brand=brand,
                variant=item['variant'],
            )
            product.flavors.set(flavors)
            product.groups.set([group])

            for i, user in enumerate(users):
                rating_value = item['ratings'][i][1]
                comment_text = item['comments'][i][1]
                Rating.objects.create(product=product, user=user, value=rating_value)
                if comment_text:
                    Comment.objects.create(product=product, user=user, text=comment_text)

        self.stdout.write(self.style.SUCCESS(f'{len(SEED_DATA)} products seeded'))
