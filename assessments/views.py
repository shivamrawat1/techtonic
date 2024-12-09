import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.shortcuts import render
from .models import Assessment


@csrf_exempt
@login_required  # Ensures only logged-in users can access this view
def save_assessment(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            conversation = data.get('conversation', [])
            if not conversation:
                return JsonResponse({'error': 'No conversation provided'}, status=400)

            # Example scoring logic (replace with your logic)
            score = len(conversation) * 10  # Dummy score based on message count

            # Save to database with the logged-in user
            Assessment.objects.create(
                user=request.user,  # Automatically associate the assessment with the logged-in user
                conversation=json.dumps(conversation),  # Store the conversation as JSON
                score=score
            )

            return JsonResponse({'message': 'Assessment saved successfully', 'score': score})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Invalid request method'}, status=400)


@login_required  # Ensures only logged-in users can access this view
def list_interviews(request):
    if request.user.is_authenticated:
        # Fetch assessments only for the logged-in user
        assessments = Assessment.objects.filter(user=request.user).order_by('-created_at')
        return render(request, 'assessments/list_interviews.html', {'assessments': assessments})
    else:
        # This case will rarely occur since @login_required ensures the user is authenticated
        return render(request, 'assessments/list_interviews.html', {'error': 'You need to log in to view your interviews.'})
