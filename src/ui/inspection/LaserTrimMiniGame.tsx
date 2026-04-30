"use client";

import { useMemo } from "react";
import type { FixMiniGameState } from "@/game/types";
import { useGameStore } from "@/game/store/game-store";

function circularPhaseDistance(a: number, b: number): number {
  const direct = Math.abs(a - b);
  return Math.min(direct, 1 - direct);
}

export function LaserTrimMiniGame({ miniGame }: { miniGame: FixMiniGameState }) {
  const registerHit = useGameStore((s) => s.registerFixMiniGameHit);
  const registerMiss = useGameStore((s) => s.registerFixMiniGameMiss);

  const phase = useMemo(() => {
    const base = (miniGame.elapsedMs / 1000) * miniGame.difficulty.speed;
    return base - Math.floor(base);
  }, [miniGame.difficulty.speed, miniGame.elapsedMs]);

  return (
    <div className="tool-mini-game laser-game">
      <p>Fire pulse when moving needle is inside each target gate.</p>
      <div className="laser-timing-track">
        <div className="laser-needle" style={{ left: `${phase * 100}%` }} />
      </div>
      <div className="tool-mini-game-board">
        {miniGame.targets.map((target) => {
          const gateCenter = target.windowCenter ?? 0.5;
          const gateSize = target.windowSize ?? 0.1;
          const offset = circularPhaseDistance(phase, gateCenter);
          const inWindow = offset <= gateSize;
          return (
            <button
              key={target.id}
              type="button"
              className={`tool-node laser-node ${target.cleared ? "tool-node-cleared" : ""} ${inWindow ? "laser-node-window" : ""}`}
              style={{ left: `${target.x}%`, top: `${target.y}%` }}
              onClick={() => {
                if (target.cleared) return;
                if (offset > gateSize) {
                  registerMiss("Pulse outside trim window.");
                  return;
                }
                registerHit(target.id, { timingOffset: offset });
              }}
              aria-label="Laser trim gate"
            >
              <span>±{Math.round(gateSize * 100)}</span>
              <small>{Math.round(offset * 100)}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}
