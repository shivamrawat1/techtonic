import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.shortcuts import render, get_object_or_404, redirect
from .models import Assessment
from .interview_analyzer import InterviewAnalyzer
from django.contrib import messages


# assessments/views.py

import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from .models import Assessment

@csrf_exempt
@login_required  # Ensures only logged-in users can access this view
def save_assessment(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            conversation = data.get('conversation', [])
            assessment_type = data.get('assessment_type', 'technical')
            
            if not conversation:
                return JsonResponse({'error': 'No conversation provided.'}, status=400)
            
            if assessment_type not in dict(Assessment.ASSESSMENT_TYPES):
                return JsonResponse({'error': 'Invalid assessment type.'}, status=400)

            # Create assessment without score
            Assessment.objects.create(
                user=request.user,
                conversation=json.dumps(conversation),
                assessment_type=assessment_type
            )

            return JsonResponse({'message': 'Assessment saved successfully'})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON.'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Invalid request method.'}, status=400)

@login_required  # Ensures only logged-in users can access this view
def list_interviews(request):
    if request.user.is_authenticated:
        # Fetch assessments only for the logged-in user
        assessments = Assessment.objects.filter(user=request.user).order_by('-created_at')
        return render(request, 'assessments/list_interviews.html', {'assessments': assessments})
    else:
        # This case will rarely occur since @login_required ensures the user is authenticated
        return render(request, 'assessments/list_interviews.html', {'error': 'You need to log in to view your interviews.'})

@login_required
def view_analysis(request, assessment_id):
    assessment = get_object_or_404(Assessment, id=assessment_id, user=request.user)
    
    if not assessment.analysis:
        try:
            # Check if conversation is already JSON
            if isinstance(assessment.conversation, str):
                conversation = json.loads(assessment.conversation)
            else:
                conversation = assessment.conversation
            
            analyzer = InterviewAnalyzer()
            analysis = analyzer.analyze_interview(conversation, assessment.assessment_type)
            
            # Store the analysis
            assessment.analysis = analysis
            assessment.save()
            
        except json.JSONDecodeError as e:
         
            return render(request, 'assessments/view_analysis.html', {
                'error': 'Unable to analyze conversation data',
                'assessment': assessment
            })
    
    return render(request, 'assessments/view_analysis.html', {
        'assessment': assessment,
        'analysis': assessment.analysis
    })

@login_required
def delete_assessment(request, assessment_id):
    import traceback
    from django.contrib import messages
    

    
    if request.method == 'POST':
        try:
            assessment = get_object_or_404(Assessment, id=assessment_id, user=request.user)
            
            # Delete the assessment
            assessment.delete()
          
            
            # Add success message
            messages.success(request, "Assessment deleted successfully.")
            
        except Exception as e:
            messages.error(request, f"Error deleting assessment: {str(e)}")
    
    # Always redirect back to the list page
    return redirect('list_interviews')
