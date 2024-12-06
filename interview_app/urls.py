# urls.py
from django.urls import path
from .views import index, get_response, ProcessAudioView, SynthesizeTextView

urlpatterns = [
    path('', index, name='index'),
    path('get_response/', get_response, name='get_response'),
    path('process_audio/', ProcessAudioView.as_view(), name='process_audio'),
    path('synthesize_text/', SynthesizeTextView.as_view(), name='synthesize_text'),
]