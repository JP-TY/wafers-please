"use client";

import { useEffect, useRef, useState } from "react";
import type { FixMiniGameState } from "@/game/types";
import { useGameStore } from "@/game/store/game-store";

export function MicroPolishMiniGame({ miniGame }: { miniGame: FixMiniGameState }) {
  const registerHit = useGameStore((s) => s.registerFixMiniGameHit);
  const registerMiss = useGameStore((s) => s.registerFixMiniGameMiss);
  const nextId = miniGame.targets[miniGame.currentTargetIndex]?.id;
  const holdTimerRef = useRef<number | null>(null);
  const [holdingId, setHoldingId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        window.clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    };
  }, []);

  const stopHold = (id: string, completed: boolean) => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (!completed && holdingId === id) {
      registerMiss("Polish path unstable. Hold steady on checkpoint.");
    }
    setHoldingId(null);
  };

  return (
    <div className="tool-mini-game polish-game">
      <p>Hold on each checkpoint until it locks. Follow sequence and avoid jitter.</p>
      <div className="tool-mini-game-board">
        {miniGame.targets.map((target, index) => (
          <button
            key={target.id}
            type="button"
            className={`tool-node ${target.cleared ? "tool-node-cleared" : ""} ${nextId === target.id ? "tool-node-active" : ""} ${holdingId === target.id ? "tool-node-holding" : ""}`}
            style={{ left: `${target.x}%`, top: `${target.y}%` }}
            onPointerDown={() => {
              if (nextId !== target.id) {
                registerMiss("Follow path order for micro polish.");
                return;
              }
              if (holdTimerRef.current) {
                window.clearTimeout(holdTimerRef.current);
              }
              setHoldingId(target.id);
              holdTimerRef.current = window.setTimeout(() => {
                registerHit(target.id);
                setHoldingId(null);
                holdTimerRef.current = null;
              }, 420);
            }}
            onPointerUp={() => stopHold(target.id, false)}
            onPointerLeave={() => stopHold(target.id, false)}
            aria-label={`Polish checkpoint ${index + 1}`}
          >
            <span>{Math.round(target.progress)}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}
