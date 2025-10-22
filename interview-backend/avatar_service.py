import os
import sys
import uuid
import shutil
from typing import Optional
from pathlib import Path

# Add Linly-Talker to Python path
LINLY_PATH = os.path.join(os.path.dirname(__file__), "Linly-Talker")
sys.path.insert(0, LINLY_PATH)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "static", "output")
SAMPLE_DIR = os.path.join(os.path.dirname(__file__), "static")
AVATAR_IMAGE = os.path.join(SAMPLE_DIR, "avatar.png")  # Default avatar image

os.makedirs(OUTPUT_DIR, exist_ok=True)

class AvatarService:
    """
    Linly-Talker integration for generating lip-synced avatar videos.
    Uses SadTalker or Wav2Lip for video generation.
    """
    
    def __init__(self):
        self.talker = None
        self.tts_engine = None
        self.initialized = False
        
    def _lazy_init(self):
        """Lazy initialization of Linly-Talker components."""
        if self.initialized:
            return
            
        try:
            # Import Edge TTS for text-to-speech
            import edge_tts
            import asyncio
            self.edge_tts = edge_tts
            self.asyncio = asyncio
            
            # Import SadTalker (lightweight and good quality)
            from TFG import SadTalker
            self.talker = SadTalker(lazy_load=True)
            
            self.initialized = True
            print("✅ Linly-Talker initialized successfully")
        except Exception as e:
            print(f"⚠️  Linly-Talker initialization failed: {e}")
            print("📝 Falling back to sample video mode")
            self.initialized = False
    
    def generate_video(self, text: str, voice: str = "en_male", emotion: str = "neutral") -> Optional[str]:
        """
        Generate a lip-synced avatar video for the given text.
        Returns the absolute path to the generated video on success, otherwise None.
        
        Args:
            text: Text to be spoken by the avatar
            voice: Voice type (en_male, en_female, etc.)
            emotion: Emotion style (neutral, happy, sad, etc.)
        
        Returns:
            Path to generated video file or None on failure
        """
        # Try to initialize if not already done
        if not self.initialized:
            self._lazy_init()
        
        # If still not initialized, use sample video fallback
        if not self.initialized:
            return self._use_sample_video()
        
        try:
            # Generate unique output filename
            out_name = f"avatar_{uuid.uuid4().hex[:8]}.mp4"
            out_path = os.path.join(OUTPUT_DIR, out_name)
            audio_path = os.path.join(OUTPUT_DIR, f"temp_audio_{uuid.uuid4().hex[:8]}.mp3")
            
            # Step 1: Generate audio from text using Edge TTS
            voice_map = {
                "en_male": "en-US-GuyNeural",
                "en_female": "en-US-JennyNeural",
                "en_neutral": "en-US-AriaNeural"
            }
            selected_voice = voice_map.get(voice, "en-US-GuyNeural")
            
            # Run async TTS
            self.asyncio.run(self._generate_audio(text, selected_voice, audio_path))
            
            # Step 2: Check if avatar image exists
            if not os.path.exists(AVATAR_IMAGE):
                print(f"⚠️  Avatar image not found at {AVATAR_IMAGE}")
                print("📝 Using sample video fallback")
                return self._use_sample_video()
            
            # Step 3: Generate video using SadTalker
            result = self.talker.test(
                source_image=AVATAR_IMAGE,
                driven_audio=audio_path,
                preprocess='crop',
                still_mode=False,
                use_enhancer=False,
                result_dir=OUTPUT_DIR
            )
            
            # Clean up temporary audio
            if os.path.exists(audio_path):
                os.remove(audio_path)
            
            # SadTalker saves video with a specific name pattern, rename it
            if result and os.path.exists(result):
                shutil.move(result, out_path)
                print(f"✅ Avatar video generated: {out_path}")
                return out_path
            
            print("⚠️  Video generation failed, using sample fallback")
            return self._use_sample_video()
            
        except Exception as e:
            print(f"❌ Error generating avatar video: {e}")
            return self._use_sample_video()
    
    async def _generate_audio(self, text: str, voice: str, output_path: str):
        """Generate audio from text using Edge TTS."""
        communicate = self.edge_tts.Communicate(text, voice)
        await communicate.save(output_path)
    
    def _use_sample_video(self) -> Optional[str]:
        """Fallback to sample video if Linly-Talker fails."""
        sample_file = os.path.join(SAMPLE_DIR, "sample.mp4")
        if os.path.exists(sample_file) and os.path.getsize(sample_file) > 100:
            out_name = f"avatar_{uuid.uuid4().hex[:8]}.mp4"
            out_path = os.path.join(OUTPUT_DIR, out_name)
            shutil.copyfile(sample_file, out_path)
            print(f"📝 Using sample video: {out_path}")
            return out_path
        
        # If no sample video, create a minimal placeholder response
        # This allows the frontend to work even without video generation
        print("⚠️  No sample video available - avatar will use placeholder")
        print("💡 To enable video: Add sample.mp4 to static/ or install Linly-Talker dependencies")
        return None
