# services/controller.py
from .speech_recognition_handler import SpeechRecognitionService
from .elevenlabs_service import ElevenLabsService

class SpeechController:
    def __init__(self, recognition_service: SpeechRecognitionService, synthesis_service: ElevenLabsService):
        self.recognition_service = recognition_service
        self.synthesis_service = synthesis_service

    async def handle_voice_command(self, audio_buffer: bytes, mimetype: str = 'audio/wav') -> str:
        recognized_text = await self.recognition_service.recognize_audio(audio_buffer, mimetype)
        return recognized_text

    def synthesize_text(self, text: str) -> bytes:
        audio = self.synthesis_service.synthesize_speech(text)
        return audio
