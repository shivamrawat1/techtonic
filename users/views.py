# users/views.py
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from .models import UserProfile, EmailVerification
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from .services import EmailService

def home(request):
    """Render the home page with options based on authentication status."""
    return render(request, 'users/home.html')

def choose_interview(request):
    """Render the page to choose the type of interview."""
    return render(request, 'users/choose_interview.html')

def login_view(request):
    """Handle user login."""
    if request.user.is_authenticated:
        return redirect('home')
    
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('home')
        else:
            messages.error(request, 'Invalid username or password.')
    else:
        form = AuthenticationForm()
    
    return render(request, 'users/login.html', {'form': form})

def logout_view(request):
    """Log out the user and redirect to home."""
    logout(request)
    return redirect('home')

def register_view(request):
    """Handle user registration."""
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('home')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = UserCreationForm()

    return render(request, 'users/register.html', {'form': form})

def register(request):
    if request.method == 'POST':
        try:
            username = request.POST.get('username', '').strip()
            email = request.POST.get('email', '').strip()
            password1 = request.POST.get('password1', '')
            password2 = request.POST.get('password2', '')

            # Validation
            if not all([username, email, password1, password2]):
                messages.error(request, 'All fields are required')
                return redirect('register')

            if password1 != password2:
                messages.error(request, 'Passwords do not match')
                return redirect('register')

            if len(password1) < 8:
                messages.error(request, 'Password must be at least 8 characters long')
                return redirect('register')

            if User.objects.filter(username=username).exists():
                messages.error(request, 'Username already exists')
                return redirect('register')

            # Check for existing email but handle unverified users
            existing_user = User.objects.filter(email=email).first()
            if existing_user:
                # If user exists but is not active (unverified)
                if not existing_user.is_active:
                    # Delete the old unverified user and their associated data
                    try:
                        EmailVerification.objects.filter(user=existing_user).delete()
                        existing_user.delete()
                    except Exception as e:
                        print(f"Error deleting unverified user: {str(e)}")
                else:
                    messages.error(request, 'Email already exists')
                    return redirect('register')

            # Create user and profile
            try:
                with transaction.atomic():
                    # Create the user - UserProfile will be created by the signal
                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        password=password1,
                        is_active=False  # User starts inactive until email is verified
                    )
                    
                    # Create verification code
                    verification_code = EmailVerification.generate_code()
                    EmailVerification.objects.create(
                        user=user,
                        code=verification_code
                    )
                    
                    # Send verification email using EmailService
                    if not EmailService.send_verification_email(user, verification_code):
                        raise Exception("Failed to send verification email")
                    
                    # Store user ID in session for verification
                    request.session['verification_user_id'] = user.id
                    
                    messages.success(request, 'Registration successful! Please check your email for verification code.')
                    return redirect('verify_email')
            
            except Exception as e:
                # If anything goes wrong, delete the user if it was created
                if 'user' in locals():
                    user.delete()
                raise e

        except Exception as e:
            print(f"Registration error: {str(e)}")  # For debugging
            messages.error(request, 'Registration failed. Please try again.')
            return redirect('register')

    return render(request, 'users/register.html')

def verify_email(request):
    user_id = request.session.get('verification_user_id')
    if not user_id:
        messages.error(request, 'Verification session expired. Please register again.')
        return redirect('register')
    
    try:
        user = User.objects.get(id=user_id)
        verification = EmailVerification.objects.get(user=user)
    except (User.DoesNotExist, EmailVerification.DoesNotExist):
        messages.error(request, 'Invalid verification session. Please register again.')
        return redirect('register')
    
    if request.method == 'POST':
        code = request.POST.get('code', '').strip()
        
        # Check if code is expired
        if timezone.now() - verification.created_at > timedelta(minutes=EmailService.VERIFICATION_EXPIRY_MINUTES):
            messages.error(request, 'Verification code expired. Please request a new one.')
            return render(request, 'users/verify_email.html')
        
        if code == verification.code:
            user.is_active = True
            user.save()
            
            user_profile = UserProfile.objects.get(user=user)
            user_profile.is_email_verified = True
            user_profile.save()
            
            verification.delete()
            del request.session['verification_user_id']
            
            login(request, user)
            messages.success(request, 'Email verified successfully!')
            return redirect('home')
        else:
            messages.error(request, 'Invalid verification code. Please try again.')
    
    return render(request, 'users/verify_email.html')

def resend_code(request):
    user_id = request.session.get('verification_user_id')
    if not user_id:
        messages.error(request, 'Verification session expired. Please register again.')
        return redirect('register')
    
    try:
        user = User.objects.get(id=user_id)
        verification = EmailVerification.objects.get(user=user)
        
        # Generate new code
        new_code = EmailVerification.generate_code()
        verification.code = new_code
        verification.created_at = timezone.now()
        verification.save()
        
        # Send new verification email using EmailService
        if not EmailService.send_verification_email(user, new_code):
            raise Exception("Failed to send verification email")
        
        messages.success(request, 'New verification code sent to your email.')
    except (User.DoesNotExist, EmailVerification.DoesNotExist):
        messages.error(request, 'Invalid verification session. Please register again.')
        return redirect('register')
    except Exception as e:
        messages.error(request, 'Failed to send verification code. Please try again.')
    
    return redirect('verify_email')

def user_login(request):
    if request.method == 'POST':
        login_field = request.POST.get('login', '').strip()
        password = request.POST.get('password', '')
        
        if not login_field or not password:
            messages.error(request, 'Please enter both login and password')
            return render(request, 'users/login.html')
        
        # First try to authenticate with username
        user = authenticate(username=login_field, password=password)
        
        # If username authentication fails, try email
        if user is None:
            try:
                # Try to find user by email
                user_profile = UserProfile.objects.get(email=login_field)
                user = authenticate(username=user_profile.user.username, password=password)
            except UserProfile.DoesNotExist:
                user = None
        
        if user is not None:
            login(request, user)
            messages.success(request, 'Login successful!')
            return redirect('home')
        else:
            messages.error(request, 'Invalid username/email or password')
    
    return render(request, 'users/login.html')

@login_required
def account(request):
    user_profile, created = UserProfile.objects.get_or_create(
        user=request.user,
        defaults={
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name
        }
    )
    
    if request.method == 'POST':
        user_profile.first_name = request.POST.get('first_name', '')
        user_profile.last_name = request.POST.get('last_name', '')
        user_profile.linkedin_profile = request.POST.get('linkedin_profile', '')
        user_profile.save()
        
        request.user.first_name = user_profile.first_name
        request.user.last_name = user_profile.last_name
        request.user.save()
        
        messages.success(request, 'Profile updated successfully')
        return redirect('account')
    
    return render(request, 'users/account.html', {'user_profile': user_profile})

@login_required
def delete_account(request):
    if request.method == 'GET':
        user = request.user
        user.delete()
        messages.success(request, 'Your account has been deleted successfully')
        return redirect('login')
    return redirect('account')
