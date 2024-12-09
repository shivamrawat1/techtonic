from django.urls import path
from . import views

from django.urls import path
from . import views

urlpatterns = [
    path('save/', views.save_assessment, name='save_assessment'),
    path('list/', views.list_interviews, name='list_interviews'),  # New endpoint
]
