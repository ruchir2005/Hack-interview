"use client";

import { Mic, MicOff, Loader2 } from "lucide-react";

interface MicrophoneButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export default function MicrophoneButton({
  isListening,
  isSupported,
  onStart,
  onStop,
  disabled = false
}: MicrophoneButtonProps) {
  
  if (!isSupported) {
    return (
      <button
        disabled
        className="p-3 rounded-full bg-gray-400 cursor-not-allowed"
        title="Speech recognition not supported in this browser"
      >
        <MicOff className="w-5 h-5 text-white" />
      </button>
    );
  }

  const handleClick = () => {
    if (isListening) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`p-3 rounded-full transition-all duration-200 ${
        isListening
          ? "bg-red-500 hover:bg-red-600 animate-pulse"
          : disabled
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-blue-500 hover:bg-blue-600"
      }`}
      title={isListening ? "Stop listening" : "Start voice input"}
    >
      {isListening ? (
        <Mic className="w-5 h-5 text-white" />
      ) : (
        <MicOff className="w-5 h-5 text-white" />
      )}
    </button>
  );
}
