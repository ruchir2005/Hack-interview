"use client";
import { useCallback } from "react";
import { useVoice } from "@/contexts/VoiceContext";
import { speak } from "@/lib/tts";

export function useSpeak() {
  const { settings } = useVoice();

  const speakIfEnabled = useCallback(
    async (text: string) => {
      if (!settings.enabled) return;
      await speak(text, { voice: settings.voice });
    },
    [settings.enabled, settings.voice]
  );

  return { speakIfEnabled, settings };
}
