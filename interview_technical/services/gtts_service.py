import io
from gtts import gTTS

class GTTSService:
    def __init__(self):
        # Initialize GTTS service
        pass

    def synthesize_speech(self, text: str) -> bytes:
        """Synthesize speech from text using gTTS and return audio bytes."""
        
        # Create an in-memory bytes buffer
        mp3_fp = io.BytesIO()
        
        # Use gTTS to generate speech
        tts = gTTS(text=text, lang='en')
        
        # Save to the buffer instead of a file
        tts.write_to_fp(mp3_fp)
        
        # Get the bytes from the buffer
        mp3_fp.seek(0)
        audio_content = mp3_fp.read()
        
        return audio_content
