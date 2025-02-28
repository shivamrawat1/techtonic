from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from .models import UserProfile
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

# Create your tests here.

class PasswordResetTest(TestCase):
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='oldpassword123'
        )
        # Get or update the user profile
        try:
            self.user_profile = UserProfile.objects.get(user=self.user)
            self.user_profile.email = 'test@example.com'
            self.user_profile.save()
        except UserProfile.DoesNotExist:
            self.user_profile = UserProfile.objects.create(
                user=self.user,
                email='test@example.com'
            )
        self.client = Client()
    
    def test_password_reset_request(self):
        # Test the password reset request view
        response = self.client.post(reverse('password_reset'), {'email': 'test@example.com'})
        self.assertEqual(response.status_code, 302)  # Should redirect to done page
        self.assertRedirects(response, reverse('password_reset_done'))
    
    def test_password_reset_confirm(self):
        # Generate token and UID
        token = default_token_generator.make_token(self.user)
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        
        # Test the password reset confirm view
        url = reverse('password_reset_confirm', kwargs={'uidb64': uid, 'token': token})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        
        # Test setting a new password
        response = self.client.post(url, {
            'password1': 'newpassword123',
            'password2': 'newpassword123'
        })
        self.assertEqual(response.status_code, 302)  # Should redirect to complete page
        self.assertRedirects(response, reverse('password_reset_complete'))
        
        # Test that the password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpassword123'))
