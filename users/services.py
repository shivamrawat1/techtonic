from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import logging

from .models import EmailVerification, User

logger = logging.getLogger(__name__)

class EmailService:
    VERIFICATION_EXPIRY_MINUTES = 10
    
    @classmethod
    def send_verification_email(cls, user, code):
        """
        Send verification email to user with the provided code
        """
        try:
            context = {
                'user': user,
                'code': code,
                'expiry_minutes': cls.VERIFICATION_EXPIRY_MINUTES
            }
            
            # Render email templates
            html_message = render_to_string(
                'users/emails/verification_email.html',
                context
            )
            plain_message = f"Your verification code is: {code}\nThis code will expire in {cls.VERIFICATION_EXPIRY_MINUTES} minutes."
            
            # Send email
            send_mail(
                subject='Verify Your Email - UMPIRE Interview Prep',
                message=plain_message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Verification email sent to {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send verification email to {user.email}: {str(e)}")
            return False
    
    @classmethod
    def send_password_reset_email(cls, user, code):
        """
        Send password reset email to user with the provided code
        """
        try:
            context = {
                'user': user,
                'code': code,
                'expiry_minutes': cls.VERIFICATION_EXPIRY_MINUTES
            }
            
            # Render email templates
            html_message = render_to_string(
                'users/emails/password_reset_email.html',
                context
            )
            plain_message = f"Your password reset code is: {code}\nThis code will expire in {cls.VERIFICATION_EXPIRY_MINUTES} minutes."
            
            # Send email
            send_mail(
                subject='Reset Your Password - UMPIRE Interview Prep',
                message=plain_message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Password reset email sent to {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send password reset email to {user.email}: {str(e)}")
            return False
    
    @classmethod
    def cleanup_expired_codes(cls):
        """
        Clean up verification codes that are older than VERIFICATION_EXPIRY_MINUTES
        Also removes associated unverified users
        """
        try:
            expiry_time = timezone.now() - timedelta(minutes=cls.VERIFICATION_EXPIRY_MINUTES)
            expired_verifications = EmailVerification.objects.filter(created_at__lt=expiry_time)
            
            # Delete unverified users associated with expired codes
            for verification in expired_verifications:
                user = verification.user
                if not user.is_active:  # Only delete if user is not verified
                    user.delete()
                    logger.info(f"Deleted unverified user {user.email} with expired verification code")
            
            # Delete expired verification codes
            count = expired_verifications.delete()[0]
            logger.info(f"Cleaned up {count} expired verification codes")
            
            return count
            
        except Exception as e:
            logger.error(f"Failed to cleanup expired codes: {str(e)}")
            return 0 