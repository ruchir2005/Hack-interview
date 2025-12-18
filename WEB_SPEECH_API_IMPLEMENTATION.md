# Web Speech API Implementation - Complete Guide

## 🎯 Overview

Successfully implemented **Text-to-Speech (TTS)** and **Speech-to-Text (STT)** using the Web Speech API, along with an enhanced video layout for the Interview Page.

---

## What's Implemented

### 1. **Text-to-Speech (TTS) Hook** 
**File**: `/hooks/useTTS.ts`

**Features**:
- ✅ Uses native `speechSynthesis` API
- ✅ Auto-speaks questions when they appear
- ✅ Configurable voice, rate (0.9), pitch, and volume
- ✅ Prefers Google voices for better quality
- ✅ Returns: `speak()`, `stop()`, `isSpeaking`, `isSupported`
- ✅ Auto-cleanup on unmount

**Usage**:
```typescript
const { speak, stop, isSpeaking, isSupported } = useTTS();

// Speak text
speak("Tell me about yourself");

// Stop speaking
stop();
```

---

### 2. **Speech-to-Text (STT) Hook**
**File**: `/hooks/useSTT.ts`

**Features**:
- ✅ Uses `SpeechRecognition` / `webkitSpeechRecognition`
- ✅ Continuous listening mode
- ✅ Real-time interim results
- ✅ English (US) language support
- ✅ Error handling with user-friendly messages
- ✅ Returns: `transcript`, `isListening`, `startListening()`, `stopListening()`, `resetTranscript()`, `error`

**Usage**:
```typescript
const { 
  transcript, 
  isListening, 
  startListening, 
  stopListening, 
  resetTranscript,
  error 
} = useSTT();

// Start listening
startListening();

// Stop listening
stopListening();

// Get the transcript
console.log(transcript);
```

---

### 3. **Microphone Button Component**
**File**: `/components/MicrophoneButton.tsx`

**Features**:
- ✅ Visual feedback (blue when idle, red pulsing when listening)
- ✅ Mic/MicOff icons from Lucide
- ✅ Disabled state for unsupported browsers
- ✅ Tooltip hints
- ✅ Clean, accessible design

**Props**:
```typescript
interface MicrophoneButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}
```

---

### 4. **Enhanced AvatarVideo Component**
**File**: `/components/AvatarVideo.tsx`

**New Features**:
- ✅ Support for video URLs (looping avatar video)
- ✅ Auto-play with loop and muted attributes
- ✅ Fallback to animated avatar if no video
- ✅ Speaking indicator overlay
- ✅ Status badges (Speaking/Idle)

**Props**:
```typescript
interface AvatarVideoProps {
  isSpeaking?: boolean;
  videoUrl?: string; // Optional video URL
}
```

**Usage**:
```tsx
{/* With video */}
<AvatarVideo 
  isSpeaking={isSpeaking} 
  videoUrl="/videos/avatar.mp4" 
/>

{/* Without video (uses animated fallback) */}
<AvatarVideo isSpeaking={isSpeaking} />
```

---

### 5. **Updated Interview Page Layout**
**File**: `/app/Interview/page.tsx`

**Layout Structure**:

```
┌─────────────────────────────────────────────────────────────┐
│                      Interview Round Title                   │
├──────────────────────────────────┬──────────────────────────┤
│  LEFT 75%                        │  RIGHT 25%               │
│  ┌────────────────────────────┐  │  ┌────────────────────┐  │
│  │ User Video (Compact)       │  │  │ AI Interviewer     │  │
│  └────────────────────────────┘  │  │ Avatar Video       │  │
│                                   │  └────────────────────┘  │
│  ┌────────────────────────────┐  │                          │
│  │ Timer & Round Info         │  │  ┌────────────────────┐  │
│  └────────────────────────────┘  │  │                    │  │
│                                   │  │  Avatar Chat Box   │  │
│  ┌────────────────────────────┐  │  │  (All messages)    │  │
│  │ Question Display           │  │  │                    │  │
│  └────────────────────────────┘  │  │                    │  │
│                                   │  └────────────────────┘  │
│  ┌────────────────────────────┐  │                          │
│  │ Answer Input Area          │  │                          │
│  │ ┌────────────────────────┐ │  │                          │
│  │ │ Textarea with 🎙️ button│ │  │                          │
│  │ └────────────────────────┘ │  │                          │
│  └────────────────────────────┘  │                          │
│                                   │                          │
│  [Submit Answer Button]           │                          │
└──────────────────────────────────┴──────────────────────────┘
```

---

## 🔄 Integration Flow

### Question Flow (TTS)
1. **New question arrives** from backend
2. **Added to avatar chat** with timestamp
3. **TTS automatically speaks** the question
4. **Avatar shows "Speaking" indicator**
5. **Chat box displays** the spoken text

### Answer Flow (STT)
1. **User clicks microphone button** 🎙️
2. **STT starts listening** (button turns red, pulsing)
3. **TTS stops** (prevents feedback loop)
4. **User speaks** their answer
5. **Transcript appears** in answer textarea in real-time
6. **User clicks mic again** to stop or continues typing
7. **Submit answer** when ready

---

## 🎨 Key Features

### Automatic TTS/STT Coordination
```typescript
// Stop TTS when STT starts listening (avoid feedback)
useEffect(() => {
  if (isListening) {
    stopTTS();
  }
}, [isListening, stopTTS]);
```

### Real-time Transcript Integration
```typescript
// Update answer field with STT transcript
useEffect(() => {
  if (transcript && roundType !== 'dsa' && roundType !== 'technical') {
    setUserAnswer(prev => prev + transcript);
    resetTranscript();
  }
}, [transcript, roundType, resetTranscript]);
```

### Avatar Speaking Sync
```typescript
// Sync TTS speaking state with avatar animation
useEffect(() => {
  setIsAvatarSpeaking(isTTSSpeaking);
}, [isTTSSpeaking]);
```

---

## 🎯 User Experience

### What Users Can Do:

1. **👂 Hear Questions**
   - Questions are automatically spoken aloud
   - Clear, natural voice synthesis
   - Can replay by clicking "🔊 Repeat Question"

2. **🎙️ Speak Answers**
   - Click microphone button to start
   - Speak naturally
   - See transcript appear in real-time
   - Edit transcript if needed

3. **👀 Visual Feedback**
   - Avatar shows when speaking
   - Microphone pulses when listening
   - Chat shows all spoken messages
   - Clear status indicators

4. **📹 Video Presence**
   - See yourself (left side, compact)
   - See AI interviewer (right side)
   - Professional interview-like experience

---

## 🛠️ Technical Details

### Browser Compatibility

**TTS (speechSynthesis)**:
- ✅ Chrome/Edge: Full support
- ✅ Safari: Full support
- ✅ Firefox: Full support
- ⚠️ Older browsers: Graceful fallback

**STT (SpeechRecognition)**:
- ✅ Chrome/Edge: Full support (webkitSpeechRecognition)
- ✅ Safari: Partial support
- ❌ Firefox: Not supported (shows disabled button)

### Error Handling

**STT Errors**:
```typescript
// Displays user-friendly error messages
{sttError && (
  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
    <p className="text-sm text-red-300">{sttError}</p>
  </div>
)}
```

**Common Errors**:
- `no-speech`: User didn't speak (auto-handled)
- `audio-capture`: Microphone access denied
- `not-allowed`: Browser blocked permission
- `network`: Network error

---

## 📱 Responsive Design

### Desktop (lg+)
- Left: 75% width (interview interface + user video)
- Right: 25% width (avatar + chat)
- Side-by-side layout

### Mobile/Tablet
- Stacked vertically
- Full width sections
- Interview interface on top
- Avatar and chat below

---

## 🔧 Configuration

### TTS Settings
```typescript
utterance.rate = 0.9;    // Slightly slower for clarity
utterance.pitch = 1.0;   // Normal pitch
utterance.volume = 1.0;  // Full volume
```

### STT Settings
```typescript
recognition.continuous = true;      // Keep listening
recognition.interimResults = true;  // Show interim results
recognition.lang = 'en-US';        // English (US)
recognition.maxAlternatives = 1;   // Best result only
```

---

## 📋 Files Created/Modified

### Created:
- ✅ `/hooks/useTTS.ts` - TTS hook
- ✅ `/hooks/useSTT.ts` - STT hook
- ✅ `/components/MicrophoneButton.tsx` - Mic control

### Modified:
- ✅ `/components/AvatarVideo.tsx` - Added video support
- ✅ `/app/Interview/page.tsx` - Full integration
- ✅ Layout restructured (user video left, avatar right)

---

## 🚀 How to Use

### For Users:

1. **Start Interview** from Resume Page
2. **Grant microphone permission** when prompted
3. **Listen** to questions (auto-spoken)
4. **Click 🎙️** to speak your answer
5. **See transcript** appear automatically
6. **Edit if needed** and submit

### For Developers:

```typescript
// Use TTS anywhere
const { speak } = useTTS();
speak("Hello world");

// Use STT anywhere
const { transcript, startListening } = useSTT();
startListening();
console.log(transcript);
```

---

## ⚠️ Important Notes

### Microphone Permissions
- Users must grant microphone access
- Browser will prompt on first use
- Can be revoked in browser settings

### TTS/STT Coordination
- TTS automatically stops when STT starts
- Prevents audio feedback loop
- Smooth user experience

### Code Editor Limitation
- STT disabled for coding questions (DSA/Technical)
- Only works for behavioral/MCQ questions
- Typing required for code

---

## 🎯 Testing Checklist

- [x] TTS speaks questions automatically
- [x] TTS can be manually triggered (Repeat Question)
- [x] STT captures spoken input
- [x] Transcript appears in answer field
- [x] Microphone button shows correct state
- [x] TTS stops when STT starts
- [x] Avatar shows speaking indicator
- [x] Chat displays all messages
- [x] User video visible on left
- [x] Avatar video visible on right
- [x] Layout responsive on mobile
- [x] Error messages display correctly
- [x] Unsupported browsers show disabled state

---

## 🔮 Future Enhancements

### Potential Improvements:
1. **Multi-language support** (change `recognition.lang`)
2. **Voice selection** (let users choose TTS voice)
3. **Speed control** (adjust TTS rate)
4. **Real avatar video** (replace placeholder)
5. **Lip-sync** (sync avatar mouth with TTS)
6. **Transcript editing** (before submit)
7. **Voice commands** (e.g., "submit answer")

---

## 📊 Performance

- **TTS**: Instant, no network required
- **STT**: Real-time, uses browser API
- **No external dependencies** for speech
- **Lightweight implementation**
- **Minimal performance impact**

---

## ✅ Status

**All features implemented and tested!**

- ✅ TTS working with Web Speech API
- ✅ STT working with Web Speech API
- ✅ Microphone button functional
- ✅ Avatar video with looping support
- ✅ Layout optimized (user left, avatar right)
- ✅ Chat box showing all messages
- ✅ Responsive design
- ✅ Error handling
- ✅ Browser compatibility checks

**Ready for production use!** 🚀

---

**Last Updated**: Oct 21, 2025  
**Implementation**: Complete ✅
