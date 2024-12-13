# interview_behavioral/urls.py

from django.urls import path
from . import views

app_name = 'interview_behavioral'

urlpatterns = [
    path('setup/', views.setup, name='setup'),
    path('', views.index, name='index'),
    path('get_response/', views.get_response, name='get_response'),
    path('process_audio/', views.ProcessAudioView.as_view(), name='process_audio'),
    path('synthesize_text/', views.SynthesizeTextView.as_view(), name='synthesize_text'),
]
