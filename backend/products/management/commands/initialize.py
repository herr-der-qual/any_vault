import os

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


User = get_user_model()


class Command(BaseCommand):
    help = 'Initialize database with superuser and basic data'

    def handle(self, *args, **options):
        self.stdout.write('Starting initialization...')

        # Create superuser
        if not User.objects.filter(is_superuser=True).exists():
            User.objects.create_superuser(
                username=os.getenv('DJANGO_SUPERUSER_USERNAME'),
                email=os.getenv('DJANGO_SUPERUSER_EMAIL'),
                password=os.getenv('DJANGO_SUPERUSER_PASSWORD'),
            )
            self.stdout.write(self.style.SUCCESS('Superuser created'))
        else:
            self.stdout.write('Superuser already exists')