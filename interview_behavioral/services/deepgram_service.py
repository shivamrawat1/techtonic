# interview_behavioral/services/deepgram_service.py

from deepgram import Deepgram
import os
import traceback
import asyncio

class DeepgramService:
    def __init__(self, api_key: str = None):
        # Initialize Deepgram client with API key
        if not api_key:
            api_key = os.getenv('DEEPGRAM_API_KEY')
        if not api_key:
            raise ValueError("API key for Deepgram is required")
        self.deepgram_client = Deepgram(api_key)

    async def transcribe_audio(self, buffer: bytes, mimetype: str = 'audio/wav') -> str:
        """Transcribe audio using Deepgram and return the transcript."""
        try:
            response = await self.deepgram_client.transcription.prerecorded(
                {'buffer': buffer, 'mimetype': mimetype},
                {'punctuate': True}
            )
            print("Deepgram response:", response)  # Debug print
            return response['results']['channels'][0]['alternatives'][0]['transcript']
        except Exception as e:
            print(f"Error in transcribe_audio: {e}")
            traceback.print_exc()  # Print detailed traceback
            raise e
