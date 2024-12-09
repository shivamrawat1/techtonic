from django.contrib.auth.models import User
from django.db import models

class Assessment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, default=1)  # Default user ID
    conversation = models.TextField()
    score = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
