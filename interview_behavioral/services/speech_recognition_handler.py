# interview_behavioral/services/speech_recognition_handler.py

import asyncio

class SpeechRecognitionService:
    def __init__(self, deepgram_service):
        self.deepgram_service = deepgram_service

    async def recognize_audio(self, audio_buffer: bytes, mimetype: str = 'audio/wav') -> str:
        return await self.deepgram_service.transcribe_audio(audio_buffer, mimetype)
