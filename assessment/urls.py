# Assessment/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('save_transcript/', views.save_transcript, name='save_transcript'),
    path('view_assessment/', views.view_assessment, name='view_assessment'),
]
