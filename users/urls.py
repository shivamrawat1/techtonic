from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', views.landingpage, name='landingpage'),
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', auth_views.LogoutView.as_view(
        next_page='landingpage'
    ), name='logout'),
    path('account/', views.account, name='account'),
    path('account/delete/', views.delete_account, name='delete_account'),
    path('verify-email/', views.verify_email, name='verify_email'),
    path('resend-code/', views.resend_code, name='resend_code'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    
    # Password reset URLs
    path('password-reset/', views.password_reset_request, name='password_reset'),
    path('password-reset/done/', views.password_reset_done, name='password_reset_done'),
    path('password-reset-confirm/<uidb64>/<token>/', views.password_reset_confirm, name='password_reset_confirm'),
    path('password-reset-complete/', views.password_reset_complete, name='password_reset_complete'),
    
    # Privacy policy URL
    path('privacy-policy/', views.privacy_policy, name='privacy_policy'),
]
