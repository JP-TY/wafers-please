"use client";

import { useEffect, useRef } from "react";
import type { FixMiniGameState } from "@/game/types";
import { useGameStore } from "@/game/store/game-store";

export function PlasmaCleanMiniGame({ miniGame }: { miniGame: FixMiniGameState }) {
  const registerHit = useGameStore((s) => s.registerFixMiniGameHit);
  const sprayTargetRef = useRef<string | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastSprayAtRef = useRef(0);

  const tickSpray = (now: number) => {
    const targetId = sprayTargetRef.current;
    if (!targetId) return;
    if (now - lastSprayAtRef.current >= 65) {
      registerHit(targetId);
      lastSprayAtRef.current = now;
    }
    frameRef.current = window.requestAnimationFrame(tickSpray);
  };

  const stopSpray = () => {
    sprayTargetRef.current = null;
    if (!frameRef.current) return;
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  };

  useEffect(() => {
    return () => {
      stopSpray();
    };
  }, []);

  return (
    <div className="tool-mini-game plasma-game">
      <p>Hold spray over each contamination cluster. Residue regenerates if you delay.</p>
      <div className="tool-mini-game-board">
        {miniGame.targets.map((target) => (
          <button
            key={target.id}
            type="button"
            className={`tool-node plasma-node ${target.cleared ? "tool-node-cleared" : ""}`}
            style={{ left: `${target.x}%`, top: `${target.y}%` }}
            onPointerDown={() => {
              stopSpray();
              registerHit(target.id);
              sprayTargetRef.current = target.id;
              lastSprayAtRef.current = 0;
              frameRef.current = window.requestAnimationFrame(tickSpray);
            }}
            onPointerUp={stopSpray}
            onPointerLeave={stopSpray}
            aria-label="Contamination cluster"
          >
            <span>{Math.max(0, Math.round(target.progress))}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}
