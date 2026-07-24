"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AudioCue } from "@/lib/myWorld/interaction/types";

const AUDIO_SETTINGS_KEY = "illo_myworld_audio_v1";

interface InteractionAudioContextValue {
  muted: boolean;
  volume: number;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  playCue: (cue: AudioCue) => void;
}

const Ctx = createContext<InteractionAudioContextValue | null>(null);

export function InteractionAudioProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.55);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(AUDIO_SETTINGS_KEY) || "null") as { muted?: boolean; volume?: number } | null;
      if (saved) { setMuted(!!saved.muted); setVolumeState(Math.max(0, Math.min(1, saved.volume ?? 0.55))); }
    } catch { /* use defaults */ }
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify({ muted, volume })); } catch { /* noop */ }
  }, [muted, volume]);

  const setVolume = useCallback((next: number) => setVolumeState(Math.max(0, Math.min(1, next))), []);

  // Asset-independent hook. A future WebAudio/file adapter can subscribe without changing Interaction UI.
  const playCue = useCallback((cue: AudioCue) => {
    if (muted || volume <= 0 || typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("my-world:audio", { detail: { cue, volume } }));
  }, [muted, volume]);

  const value = useMemo(() => ({ muted, volume, setMuted, setVolume, playCue }), [muted, volume, setVolume, playCue]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInteractionAudio(): InteractionAudioContextValue {
  const value = useContext(Ctx);
  if (!value) throw new Error("useInteractionAudio must be used within <InteractionAudioProvider>");
  return value;
}
