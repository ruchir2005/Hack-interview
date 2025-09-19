import os
from typing import Dict
from dotenv import load_dotenv
from fastapi import HTTPException

# ElevenLabs v2 SDK client
try:
    from elevenlabs.client import ElevenLabs
except Exception:
    ElevenLabs = None  # type: ignore

load_dotenv()

class VoiceService:
    """Wrapper around ElevenLabs Text-to-Speech (v2 client API)."""

    def __init__(self) -> None:
        api_key = os.getenv("ELEVENLABS_API_KEY")
        if not api_key:
            raise ValueError("ELEVENLABS_API_KEY not found in environment variables. Add it to interview-backend/.env")
        if ElevenLabs is None:
            raise RuntimeError("elevenlabs package not installed. Please add it to requirements.txt and install.")
        self.client = ElevenLabs(api_key=api_key)
        # Common free-tier public voice IDs
        self.available_voices: Dict[str, str] = {
            "rachel": "21m00Tcm4TlvDq8ikWAM",
            "domi": "AZnzlk1XvdvUeBnXmlld",
            "bella": "EXAVITQu4vr4xnSDxMaL",
        }

    def list_voices(self) -> Dict[str, str]:
        return self.available_voices

    def text_to_speech(self, text: str, voice: str = "rachel") -> bytes:
        # Trim overly long text to save free-tier characters
        if len(text) > 1200:
            text = text[:1200] + "..."

        # Map name to ID if needed
        voice_id = self.available_voices.get(voice, voice)
        try:
            # Stream bytes and join
            stream = self.client.text_to_speech.convert(
                voice_id=voice_id,
                model_id="eleven_multilingual_v2",
                text=text,
                output_format="mp3_44100_128",
            )
            # SDK yields bytes chunks; some versions yield memoryviews
            chunks: list[bytes] = []
            for part in stream:
                if isinstance(part, (bytes, bytearray)):
                    chunks.append(bytes(part))
                else:
                    try:
                        # Fallback if chunk-like
                        chunks.append(bytes(part))
                    except Exception:
                        pass
            data = b"".join(chunks)
            return data
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"TTS Error: {str(e)}")
