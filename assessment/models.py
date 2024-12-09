# Assessment/models.py

from django.db import models
from django.contrib.auth.models import User

class Transcript(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transcripts')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Transcript by {self.user.username} on {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
