"use client";

import { useCallback, useRef } from "react";

export type CueType = "soft" | "confirm" | "warn";

const cueMap: Record<CueType, { frequency: number; duration: number; gain: number }> = {
  soft: { frequency: 420, duration: 0.05, gain: 0.018 },
  confirm: { frequency: 620, duration: 0.08, gain: 0.025 },
  warn: { frequency: 240, duration: 0.1, gain: 0.03 }
};

export function useUiAudio() {
  const contextRef = useRef<AudioContext | null>(null);

  const playCue = useCallback((type: CueType) => {
    if (typeof window === "undefined") return;
    const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;

    if (!contextRef.current) {
      contextRef.current = new Ctx();
    }
    const ctx = contextRef.current;
    const cue = cueMap[type];

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type === "warn" ? "square" : "sine";
    oscillator.frequency.value = cue.frequency;
    gain.gain.value = cue.gain;
    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + cue.duration);
  }, []);

  return { playCue };
}
