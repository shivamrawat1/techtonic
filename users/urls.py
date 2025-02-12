from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', views.home, name='home'),
    path('register/', views.register, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', auth_views.LogoutView.as_view(
        template_name='users/login.html',
        next_page='login'
    ), name='logout'),
    path('account/', views.account, name='account'),
    path('account/delete/', views.delete_account, name='delete_account'),
]
