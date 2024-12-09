import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Assessment
from django.shortcuts import render
from .models import Assessment


@csrf_exempt
def save_assessment(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            conversation = data.get('conversation', [])
            if not conversation:
                return JsonResponse({'error': 'No conversation provided'}, status=400)

            # Example scoring logic (replace with your logic)
            score = len(conversation) * 10  # Dummy score based on message count

            # Save to database
            Assessment.objects.create(conversation=json.dumps(conversation), score=score)

            return JsonResponse({'message': 'Assessment saved successfully', 'score': score})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Invalid request method'}, status=400)


def list_interviews(request):
    if request.user.is_authenticated:
        assessments = Assessment.objects.filter(user=request.user).order_by('-created_at')
        return render(request, 'assessments/list_interviews.html', {'assessments': assessments})
    else:
        return render(request, 'assessments/list_interviews.html', {'error': 'You need to log in to view your interviews.'})