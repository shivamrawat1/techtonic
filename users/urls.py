from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', views.home, name='home'),
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', auth_views.LogoutView.as_view(
        next_page='home'
    ), name='logout'),
    path('account/', views.account, name='account'),
    path('account/delete/', views.delete_account, name='delete_account'),
    path('verify-email/', views.verify_email, name='verify_email'),
    path('resend-code/', views.resend_code, name='resend_code'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
]
