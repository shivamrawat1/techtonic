from .deepgram_service import DeepgramService

class SpeechRecognitionService:
    def __init__(self, deepgram_service: DeepgramService):
        # Initialize speech recognition service with Deepgram
        self.deepgram_service = deepgram_service

    async def recognize_audio(self, audio_buffer: bytes, mimetype: str = 'audio/wav') -> str:
        """Recognize audio and return the transcribed text."""
        try:
            print("Recognizing audio...")  # Debug print
            result = await self.deepgram_service.transcribe_audio(audio_buffer, mimetype)
            print(f"Transcription result: {result}")  # Debug print
            return result
        except Exception as e:
            print(f"Error in recognize_audio: {e}")
            raise e
