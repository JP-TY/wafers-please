"use client";

import { useEffect } from "react";
import { useGameStore } from "@/game/store/game-store";

/** Drives fix mini-game simulation time while the store phase is active (desktop or VR). */
export function useFixMiniGameTick() {
  const miniGame = useGameStore((s) => s.fixMiniGame);
  const tick = useGameStore((s) => s.tickFixMiniGame);
  const active = Boolean(miniGame && miniGame.phase === "active");

  useEffect(() => {
    if (!active || !miniGame) return;
    let frameId = 0;
    const run = () => {
      tick(Date.now());
      frameId = window.requestAnimationFrame(run);
    };
    frameId = window.requestAnimationFrame(run);
    return () => window.cancelAnimationFrame(frameId);
  }, [active, miniGame, tick]);
}

/** When the mini-game reaches success, apply the fix through the store (same as DOM host). */
export function useFixMiniGameSuccessApply() {
  const miniGame = useGameStore((s) => s.fixMiniGame);
  const completeFixMiniGame = useGameStore((s) => s.completeFixMiniGame);

  useEffect(() => {
    if (!miniGame || miniGame.phase !== "success") return;
    completeFixMiniGame();
  }, [completeFixMiniGame, miniGame]);
}
