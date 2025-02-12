# users/views.py
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from .models import UserProfile
from django.db import transaction

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

            if User.objects.filter(email=email).exists():
                messages.error(request, 'Email already exists')
                return redirect('register')

            # Create user and profile
            try:
                with transaction.atomic():
                    # Create the user - UserProfile will be created by the signal
                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        password=password1
                    )
                    
                    # Log the user in
                    user = authenticate(username=username, password=password1)
                    if user is not None:
                        login(request, user)
                        messages.success(request, 'Registration successful!')
                        return redirect('home')
                    else:
                        raise Exception('Authentication failed after user creation')
            
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
