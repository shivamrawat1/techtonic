from .speech_recognition_handler import SpeechRecognitionService
from .gtts_service import GTTSService

class SpeechController:
    def __init__(self, recognition_service: SpeechRecognitionService, synthesis_service: GTTSService):
        # Initialize services for speech recognition and synthesis
        self.recognition_service = recognition_service
        self.synthesis_service = synthesis_service

    async def handle_voice_command(self, audio_buffer: bytes, mimetype: str = 'audio/wav') -> str:
        """Handle voice command by recognizing audio and returning the text."""
        recognized_text = await self.recognition_service.recognize_audio(audio_buffer, mimetype)
        return recognized_text

    def synthesize_text(self, text: str) -> bytes:
        """Synthesize text to speech and return audio bytes."""
        audio = self.synthesis_service.synthesize_speech(text)
        return audio
