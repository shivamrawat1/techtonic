from django.core.management.base import BaseCommand
from users.services import EmailService

class Command(BaseCommand):
    help = 'Clean up expired verification codes and associated unverified users'

    def handle(self, *args, **kwargs):
        count = EmailService.cleanup_expired_codes()
        self.stdout.write(
            self.style.SUCCESS(f'Successfully cleaned up {count} expired verification codes')
        ) 