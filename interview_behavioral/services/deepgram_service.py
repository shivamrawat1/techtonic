# interview_behavioral/services/deepgram_service.py

from deepgram import (
    DeepgramClient,
    PrerecordedOptions,
    FileSource,
)
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
        self.deepgram_client = DeepgramClient(api_key)

    async def transcribe_audio(self, buffer: bytes, mimetype: str = 'audio/wav') -> str:
        """Transcribe audio using Deepgram and return the transcript."""
        try:
            # Prepare the payload with the audio buffer
            payload: FileSource = {
                "buffer": buffer,
                "mimetype": mimetype
            }
            
            # Configure options for transcription
            options = PrerecordedOptions(
                model="nova-3",
                smart_format=True,
            )
            
            # Call the transcribe_file method
            response = await self.deepgram_client.listen.asyncprerecorded.v("1").transcribe_file(payload, options)
            
            
            # Extract the transcript from the response
            return response.results.channels[0].alternatives[0].transcript
        except Exception as e:
            
            raise e
