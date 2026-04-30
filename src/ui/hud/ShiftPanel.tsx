"use client";

import { useGameStore } from "@/game/store/game-store";

function asClock(seconds: number, shiftSeconds: number): string {
  const remaining = Math.max(0, shiftSeconds - seconds);
  const mins = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const secs = (remaining % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export function ShiftPanel() {
  const currentDay = useGameStore((s) => s.currentDay);
  const currentRules = useGameStore((s) => s.currentRules);
  const elapsed = useGameStore((s) => s.elapsedSeconds);
  const acc = useGameStore((s) => s.accumulator);
  const competency = acc.processed === 0 ? 0 : Math.round((acc.correctDecisions / acc.processed) * 100);

  return (
    <section className="console-panel">
      <div className="panel-head">
        <span className="panel-tag">Progress</span>
        <span className="panel-subtag">Shift Board</span>
      </div>
      <div className="inline-row">
        <span className="status-chip">Day {currentDay}</span>
        <span className="status-chip">Remaining {asClock(elapsed, currentRules.shiftSeconds)}</span>
        <span className="status-chip">Processed {acc.processed}</span>
        <span className="status-chip">Salary ${acc.salary}</span>
      </div>
      <div className="panel-block">
        <h3>Performance Targets</h3>
        <p>Salary Target: ${currentRules.salaryTarget}</p>
        <p>Competency Target: {currentRules.competencyTarget}%</p>
        <p>Current Competency: {competency}%</p>
      </div>
    </section>
  );
}
