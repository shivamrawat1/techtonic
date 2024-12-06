# services/deepgram_service.py
from deepgram import Deepgram
import os

class DeepgramService:
    def __init__(self, api_key: str = None):
        if not api_key:
            api_key = os.getenv('DEEPGRAM_API_KEY')
        if not api_key:
            raise ValueError("API key for Deepgram is required")
        self.deepgram_client = Deepgram(api_key)

    async def transcribe_audio(self, buffer: bytes, mimetype: str = 'audio/wav') -> str:
        response = await self.deepgram_client.transcription.prerecorded({
            'buffer': buffer,
            'mimetype': mimetype
        }, {
            'punctuate': True
        })
        return response['results']['channels'][0]['alternatives'][0]['transcript']