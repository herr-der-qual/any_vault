from django.core.management.base import BaseCommand

from products.models.color import Color

COLOR_PALETTE = [
    {'name': 'Pink',        'primary': '#FCE4EC', 'secondary': '#D81B60'},
    {'name': 'Red',         'primary': '#FFEBEE', 'secondary': '#C62828'},
    {'name': 'Orange',      'primary': '#FFF3E0', 'secondary': '#EF6C00'},
    {'name': 'Yellow',      'primary': '#FFFDE7', 'secondary': '#F9A825'},
    {'name': 'Light green', 'primary': '#F1F8E9', 'secondary': '#7CB342'},
    {'name': 'Purple',      'primary': '#F3E5F5', 'secondary': '#7B1FA2'},
    {'name': 'Blue',        'primary': '#E8EAF6', 'secondary': '#283593'},
    {'name': 'Light blue',  'primary': '#E1F5FE', 'secondary': '#0288D1'},
    {'name': 'Mint',        'primary': '#E0F2F1', 'secondary': '#00897B'},
    {'name': 'Green',       'primary': '#E8F5E9', 'secondary': '#2E7D32'},
    {'name': 'Brown',       'primary': '#F5ECE0', 'secondary': '#4E2E1C'},
    {'name': 'Black',       'primary': '#F5F5F5', 'secondary': '#212121'},
    {'name': 'Gray',        'primary': '#FAFAFA', 'secondary': '#9E9E9E'},
]


class Command(BaseCommand):
    help = 'Seed the default color palette'

    def handle(self, *args, **options):
        created = 0
        for c in COLOR_PALETTE:
            _, was_created = Color.objects.get_or_create(name=c['name'], defaults={
                'primary': c['primary'],
                'secondary': c['secondary'],
            })
            if was_created:
                created += 1

        if created:
            self.stdout.write(self.style.SUCCESS(f'{created} colors seeded'))
        else:
            self.stdout.write('Colors already seeded')
