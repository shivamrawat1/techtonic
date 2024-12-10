import json
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from django.contrib.auth.decorators import login_required
import asyncio

from interview_technical.openai_client import OpenAIClient
from interview_technical.services.deepgram_service import DeepgramService
from interview_technical.services.speech_recognition_handler import SpeechRecognitionService
from interview_technical.services.controller import SpeechController
from interview_technical.services.gtts_service import GTTSService

# Initialize the OpenAI client
openai_client = OpenAIClient()

# Initialize services
deepgram_service = DeepgramService()
recognition_service = SpeechRecognitionService(deepgram_service)

# Initialize gTTS service
gtts_service = GTTSService()
controller = SpeechController(recognition_service, gtts_service)

@login_required
@ensure_csrf_cookie
def index(request):
    return render(request, 'interview_technical/index.html')

@csrf_exempt
def get_response(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_message = data.get('message')
            if not user_message:
                return JsonResponse({'error': 'Message is required.'}, status=400)
            print(f"Received user message: {user_message}")

            # Call OpenAIClient to get a response
            assistant_message = openai_client.get_response(user_message)
            return JsonResponse({'message': assistant_message})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON.'}, status=400)
    else:
        return JsonResponse({'error': 'Invalid request method.'}, status=400)

@method_decorator(csrf_exempt, name='dispatch')
class ProcessAudioView(View):
    async def post(self, request):
        try:
            print("Processing audio in ProcessAudioView...")  # Debug print
            audio_file = request.FILES.get('audio')
            if not audio_file:
                return JsonResponse({'error': 'No audio file provided'}, status=400)

            # Read audio file and pass it for recognition
            audio_buffer = audio_file.read()
            recognized_text = await controller.handle_voice_command(audio_buffer)
            print(f"Recognized text: {recognized_text}")  # Debug print
            return JsonResponse({'recognized_text': recognized_text})
        except Exception as e:
            print(f"Error in ProcessAudioView: {e}")
            return JsonResponse({'error': str(e)}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class SynthesizeTextView(View):
    def post(self, request):
        text = request.POST.get('text', '')
        if not text:
            return JsonResponse({'error': 'No text provided'}, status=400)

        print(f"Received text for synthesis: {text}")
        try:
            audio_content = controller.synthesize_text(text)
            print("Synthesis completed successfully.")
            response = HttpResponse(audio_content, content_type='audio/mp3')
            response['Content-Disposition'] = 'attachment; filename="output.mp3"'
            return response
        except Exception as e:
            print(f"Error during synthesis: {e}")
            return JsonResponse({'error': str(e)}, status=500)
