# interview_behavioral/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='behavioral_index'),  # Behavioral index view
    path('get_response/', views.get_response, name='behavioral_get_response'),  # For chat interactions
    path('process_audio/', views.ProcessAudioView.as_view(), name='behavioral_process_audio'),  # For processing audio
    path('synthesize_text/', views.SynthesizeTextView.as_view(), name='behavioral_synthesize_text'),  # For TTS
    # Removed the separate 'save/' endpoint
    # Removed the 'list/' endpoint if it exists
]
