# Assessment/admin.py

from django.contrib import admin
from .models import Transcript

@admin.register(Transcript)
class TranscriptAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at')
    search_fields = ('user__username', 'content')
    list_filter = ('created_at',)
