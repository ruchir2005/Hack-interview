"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type VoiceSettings = {
  enabled: boolean;
  voice: string; // name or id
};

const DEFAULTS: VoiceSettings = {
  enabled: false,
  voice: "rachel",
};

const VoiceContext = createContext<{
  settings: VoiceSettings;
  setEnabled: (enabled: boolean) => void;
  setVoice: (voice: string) => void;
}>({
  settings: DEFAULTS,
  setEnabled: () => {},
  setVoice: () => {},
});

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULTS);

  // Load persisted settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem("voice_settings");
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings({ ...DEFAULTS, ...parsed });
      }
    } catch {}
  }, []);

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem("voice_settings", JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const api = useMemo(
    () => ({
      settings,
      setEnabled: (enabled: boolean) => setSettings((s) => ({ ...s, enabled })),
      setVoice: (voice: string) => setSettings((s) => ({ ...s, voice })),
    }),
    [settings]
  );

  return <VoiceContext.Provider value={api}>{children}</VoiceContext.Provider>;
}

export function useVoice() {
  return useContext(VoiceContext);
}
