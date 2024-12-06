# services/elevenlabs_service.py
import os
import httpx

class ElevenLabsService:
    def __init__(self, api_key: str = None):
        if not api_key:
            api_key = os.getenv('ELEVENLABS_API_KEY')
        print(f"Using ElevenLabs API Key: {api_key}")
        if not api_key:
            raise ValueError("API key for ElevenLabs is required")
        self.api_key = api_key
        self.base_url = "https://api.elevenlabs.io/v1"

    def synthesize_speech(self, text: str) -> bytes:
        headers = {
            "Content-Type": "application/json",
            "xi-api-key": self.api_key
        }
        payload = {
            "text": text,
            "voice_id": "9BWtsMINqrJLrRacOk9x",
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }

        print(f"Sending request to ElevenLabs API with payload: {payload}")
        response = httpx.post(f"{self.base_url}/text-to-speech/{payload['voice_id']}", json=payload, headers=headers)

        if response.status_code == 200:
            print("ElevenLabs API call was successful.")
            return response.content
        else:
            print(f"Error from ElevenLabs API: {response.status_code} {response.text}")
            raise Exception(f"Error from ElevenLabs API: {response.status_code} {response.text}")
