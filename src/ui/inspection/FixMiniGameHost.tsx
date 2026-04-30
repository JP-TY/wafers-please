"use client";

import { useEffect } from "react";
import { useGameStore } from "@/game/store/game-store";
import { LaserTrimMiniGame } from "@/ui/inspection/LaserTrimMiniGame";
import { MicroPolishMiniGame } from "@/ui/inspection/MicroPolishMiniGame";
import { PlasmaCleanMiniGame } from "@/ui/inspection/PlasmaCleanMiniGame";

export function FixMiniGameHost() {
  const miniGame = useGameStore((s) => s.fixMiniGame);
  const tick = useGameStore((s) => s.tickFixMiniGame);
  const completeFixMiniGame = useGameStore((s) => s.completeFixMiniGame);
  const abortMiniGame = useGameStore((s) => s.abortMiniGame);

  useEffect(() => {
    if (!miniGame || miniGame.phase !== "active") return;
    let frameId = 0;
    const run = () => {
      tick(Date.now());
      frameId = window.requestAnimationFrame(run);
    };
    frameId = window.requestAnimationFrame(run);
    return () => window.cancelAnimationFrame(frameId);
  }, [miniGame, tick]);

  useEffect(() => {
    if (!miniGame) return;
    if (miniGame.phase === "success") {
      completeFixMiniGame();
    }
  }, [completeFixMiniGame, miniGame]);

  if (!miniGame) return null;
  const toolTitle =
    miniGame.tool === "micro-polish"
      ? "Micro Polish"
      : miniGame.tool === "plasma-clean"
        ? "Plasma Clean"
        : "Laser Trim";
  const toolHint =
    miniGame.tool === "micro-polish"
      ? "Keep a steady hand and lock each checkpoint."
      : miniGame.tool === "plasma-clean"
        ? "Sustain spray pressure and prevent residue rebound."
        : "Pulse precisely inside moving trim windows.";

  return (
    <div className="fix-mini-game-shell">
      <div className="fix-mini-game-head">
        <strong>{toolTitle} Simulation</strong>
        <span>
          Progress {miniGame.progress}% | Misses {miniGame.failures}/{miniGame.difficulty.maxMisses}
        </span>
      </div>
      <p className="fix-mini-game-hint">{toolHint}</p>
      <div className="fix-mini-game-progress">
        <div className="fix-mini-game-progress-bar" style={{ width: `${miniGame.progress}%` }} />
      </div>
      <p className="fix-mini-game-message">{miniGame.message}</p>
      <p className="fix-mini-game-timer">
        Time left: {Math.max(0, Math.ceil((miniGame.timeLimitMs - miniGame.elapsedMs) / 1000))}s
      </p>
      {miniGame.tool === "micro-polish" ? <MicroPolishMiniGame miniGame={miniGame} /> : null}
      {miniGame.tool === "plasma-clean" ? <PlasmaCleanMiniGame miniGame={miniGame} /> : null}
      {miniGame.tool === "laser-trim" ? <LaserTrimMiniGame miniGame={miniGame} /> : null}
      {miniGame.phase === "failed" ? (
        <div className="fix-mini-game-actions">
          <button type="button" onClick={abortMiniGame}>
            Restart Fix Quiz
          </button>
        </div>
      ) : null}
      {miniGame.phase === "success" ? (
        <div className="fix-mini-game-actions">
          <button type="button" onClick={completeFixMiniGame}>
            Apply Fix Now
          </button>
        </div>
      ) : null}
    </div>
  );
}
