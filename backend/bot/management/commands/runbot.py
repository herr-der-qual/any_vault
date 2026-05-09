import asyncio
from django.core.management.base import BaseCommand
from bot.main import main


class Command(BaseCommand):
    help = 'Run the Telegram bot'

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Starting Telegram bot...')
        )
        try:
            asyncio.run(main())
        except KeyboardInterrupt:
            self.stdout.write(
                self.style.WARNING('Bot stopped by user')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Bot error: {e}')
            )

