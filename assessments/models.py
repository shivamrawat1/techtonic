# assessments/models.py

from django.contrib.auth.models import User
from django.db import models

class Assessment(models.Model):
    ASSESSMENT_TYPES = [
        ('behavioral', 'Behavioral'),
        ('technical', 'Technical'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, default=1)  # Default user ID
    conversation = models.TextField()
    score = models.FloatField()
    assessment_type = models.CharField(
        max_length=20,
        choices=ASSESSMENT_TYPES,
        default='technical'  # Set 'technical' as default to avoid migration issues
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.get_assessment_type_display()} Assessment by {self.user.username} on {self.created_at.strftime('%Y-%m-%d')}"
