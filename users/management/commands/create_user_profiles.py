from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from users.models import UserProfile

class Command(BaseCommand):
    help = 'Creates UserProfile for users that do not have one'

    def handle(self, *args, **kwargs):
        users_without_profile = User.objects.filter(userprofile__isnull=True)
        created_count = 0
        
        for user in users_without_profile:
            UserProfile.objects.create(
                user=user,
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name
            )
            created_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_count} user profiles'
            )
        ) 