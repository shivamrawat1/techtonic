# test_elevenlabs_service.py
from interview_technical.services.gtts_service import ElevenLabsService

def main():
    # Replace this with your actual ElevenLabs API key
    elevenlabs_api_key = "sk_1f6f3b4d1d51ebc33ce7e7f8bc1f9291598c73f1465020ce"
    
    # Initialize the ElevenLabsService
    tts_service = ElevenLabsService(api_key=elevenlabs_api_key)
    
    # Text to be converted to speech
    text = "Hello, this is a test to check the speech synthesis with ElevenLabs."

    try:
        # Generate the audio
        audio_content = tts_service.synthesize_speech(text)
        
        # Save the output to a file for playback
        with open("output.mp3", "wb") as audio_file:
            audio_file.write(audio_content)
        
        print("Audio saved successfully as 'output.mp3'")
    
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()



