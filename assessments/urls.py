from django.urls import path
from . import views


urlpatterns = [
    path('save/', views.save_assessment, name='save_assessment'),
    path('list/', views.list_interviews, name='list_interviews'),  # New endpoint
    path('analysis/<int:assessment_id>/', views.view_analysis, name='view_analysis'),
    path('delete/<int:assessment_id>/', views.delete_assessment, name='delete_assessment'),
]
