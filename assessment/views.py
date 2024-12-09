# Assessment/views.py

from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import json
from .models import Transcript

@login_required
@csrf_exempt
def save_transcript(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            transcript_content = data.get('transcript', '').strip()
            if not transcript_content:
                return JsonResponse({'success': False, 'error': 'Transcript is empty.'}, status=400)
            
            # Save the transcript to the database
            Transcript.objects.create(user=request.user, content=transcript_content)
            return JsonResponse({'success': True})
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid JSON.'}, status=400)
    else:
        return JsonResponse({'success': False, 'error': 'Invalid request method.'}, status=400)

@login_required
def view_assessment(request):
    # Retrieve the latest transcript from the database
    latest_transcript = Transcript.objects.filter(user=request.user).order_by('-created_at').first()
    context = {
        'transcript': latest_transcript.content if latest_transcript else 'No transcript available.'
    }
    return render(request, 'assessment/view_assessment.html', context)
