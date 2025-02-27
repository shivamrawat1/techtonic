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
from django.views.decorators.csrf import ensure_csrf_cookie

def landingpage(request):
    """Render the home page with options based on authentication status."""
    return render(request, 'users/landingpage.html')

def choose_interview(request):
    """Render the page to choose the type of interview."""
    return render(request, 'users/choose_interview.html')

def login_view(request):
    """Handle user login."""
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    if request.method == 'POST':
        username = request.POST.get('login')
        password = request.POST.get('password')
        
        # First try to authenticate with username
        user = authenticate(username=username, password=password)
        
        # If username authentication fails, try email
        if user is None:
            try:
                # Try to find user by email
                user_profile = UserProfile.objects.get(email=username)
                user = authenticate(username=user_profile.user.username, password=password)
            except UserProfile.DoesNotExist:
                user = None
        
        if user is not None:
            login(request, user)
            messages.success(request, f'Welcome back, {user.username}!')
            return redirect('dashboard')
        else:
            messages.error(request, 'Invalid username/email or password')
    
    return render(request, 'users/login.html')

def logout_view(request):
    """Log out the user and redirect to home."""
    logout(request)
    return redirect('home')

def register_view(request):
    """Handle user registration."""
    if request.user.is_authenticated:
        return redirect('landingpage')

    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('landingpage')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = UserCreationForm()

    return render(request, 'users/register.html', {'form': form})

def register(request):
    # If user is already authenticated, redirect to dashboard
    if request.user.is_authenticated:
        return redirect('dashboard')

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

@ensure_csrf_cookie
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
            return redirect('login')
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
        try:
            user_profile.first_name = request.POST.get('first_name', '')
            user_profile.last_name = request.POST.get('last_name', '')
            user_profile.linkedin_profile = request.POST.get('linkedin_profile', '')
            user_profile.save()
            
            request.user.first_name = user_profile.first_name
            request.user.last_name = user_profile.last_name
            request.user.save()
            
            return redirect(f'{request.path}?success=true')
        except Exception as e:
            print(f"Error updating profile: {str(e)}")  # For debugging
            messages.error(request, 'Failed to update profile. Please try again.')
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

@login_required
def dashboard_view(request):
    # Import Assessment model from assessments app
    from assessments.models import Assessment
    from django.db.models import Avg, Count, Q
    import json
    from datetime import datetime, timedelta
    
    # Get user's assessments
    user_assessments = Assessment.objects.filter(user=request.user)
    
    # Assessment statistics
    assessment_stats = {
        'total': user_assessments.count(),
        'technical': user_assessments.filter(assessment_type='technical').count(),
        'behavioral': user_assessments.filter(assessment_type='behavioral').count(),
    }
    
    # Calculate weekly data for the bar chart (last 7 days)
    weekly_data = []
    today = timezone.now().date()
    
    # Get the date 7 days ago
    seven_days_ago = today - timedelta(days=6)
    
    # Create a list of the last 7 days
    date_list = [(seven_days_ago + timedelta(days=i)) for i in range(7)]
    
    # Maximum count to normalize heights
    max_count = 1  # Start with 1 to avoid division by zero
    
    # First pass: collect counts and find maximum
    temp_data = []
    for day_date in date_list:
        # Count assessments for this day
        day_start = timezone.make_aware(datetime.combine(day_date, datetime.min.time()))
        day_end = timezone.make_aware(datetime.combine(day_date, datetime.max.time()))
        
        technical_count = user_assessments.filter(
            assessment_type='technical',
            created_at__gte=day_start,
            created_at__lte=day_end
        ).count()
        
        behavioral_count = user_assessments.filter(
            assessment_type='behavioral',
            created_at__gte=day_start,
            created_at__lte=day_end
        ).count()
        
        # Update max count if needed
        day_max = max(technical_count, behavioral_count)
        if day_max > max_count:
            max_count = day_max
        
        temp_data.append({
            'date': day_date,
            'technical': technical_count,
            'behavioral': behavioral_count,
        })
    
    # Generate y-axis values (0 to max_count)
    y_axis_values = []
    if max_count <= 5:
        # If max count is small, show all integers
        y_axis_values = list(range(max_count, -1, -1))
    else:
        # Otherwise, show approximately 5 values
        step = max(1, round(max_count / 4))
        current = max_count
        while current >= 0:
            y_axis_values.append(current)
            current -= step
        if current + step > 0:
            y_axis_values.append(0)
    
    # Second pass: calculate heights as percentages
    for day_data in temp_data:
        # Calculate height percentages (0-100)
        technical_height = (day_data['technical'] / max_count) * 100 if max_count > 0 else 0
        behavioral_height = (day_data['behavioral'] / max_count) * 100 if max_count > 0 else 0
        
        # Format the day label
        if day_data['date'] == today:
            day_label = 'Today'
        elif day_data['date'] == today - timedelta(days=1):
            day_label = 'Yesterday'
        else:
            day_label = day_data['date'].strftime('%a')
        
        weekly_data.append({
            'label': day_label,
            'technical': day_data['technical'],
            'behavioral': day_data['behavioral'],
            'technical_height': technical_height,
            'behavioral_height': behavioral_height,
        })
    
    # Technical skills breakdown
    tech_skills = {}
    tech_assessments = user_assessments.filter(assessment_type='technical').exclude(analysis__isnull=True)
    
    if tech_assessments.exists():
        # UMPIRE components for technical interviews
        components = ['understanding', 'match', 'plan', 'implement', 'review', 'evaluate']
        component_scores = {comp: [] for comp in components}
        
        for assessment in tech_assessments:
            try:
                analysis = assessment.analysis
                if isinstance(analysis, str):
                    analysis = json.loads(analysis)
                
                if 'components' in analysis:
                    for comp in components:
                        if comp in analysis['components'] and 'score' in analysis['components'][comp]:
                            component_scores[comp].append(float(analysis['components'][comp]['score']))
            except (json.JSONDecodeError, TypeError, KeyError):
                continue
        
        # Calculate average scores for each component
        for comp in components:
            if component_scores[comp]:
                tech_skills[comp.capitalize()] = round(sum(component_scores[comp]) / len(component_scores[comp]))
    
    # Behavioral skills breakdown
    behavioral_skills = {}
    behavioral_assessments = user_assessments.filter(assessment_type='behavioral').exclude(analysis__isnull=True)
    
    if behavioral_assessments.exists():
        # STAR components for behavioral interviews
        components = ['situation', 'task', 'action', 'result']
        component_scores = {comp: [] for comp in components}
        
        for assessment in behavioral_assessments:
            try:
                analysis = assessment.analysis
                if isinstance(analysis, str):
                    analysis = json.loads(analysis)
                
                if 'components' in analysis:
                    for comp in components:
                        if comp in analysis['components'] and 'score' in analysis['components'][comp]:
                            component_scores[comp].append(float(analysis['components'][comp]['score']))
            except (json.JSONDecodeError, TypeError, KeyError):
                continue
        
        # Calculate average scores for each component
        for comp in components:
            if component_scores[comp]:
                behavioral_skills[comp] = {
                    'score': round(sum(component_scores[comp]) / len(component_scores[comp])),
                }
    
    context = {
        'assessment_stats': assessment_stats,
        'weekly_data': weekly_data,
        'tech_skills': tech_skills,
        'behavioral_skills': behavioral_skills,
        'max_count': max_count,
        'y_axis_values': y_axis_values,
    }
    
    return render(request, 'users/dashboard.html', context)
