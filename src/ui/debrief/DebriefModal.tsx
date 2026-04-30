"use client";

import { useGameStore } from "@/game/store/game-store";

export function DebriefModal() {
  const currentDay = useGameStore((s) => s.currentDay);
  const currentRules = useGameStore((s) => s.currentRules);
  const result = useGameStore((s) => s.result);
  const advanceToNextDay = useGameStore((s) => s.advanceToNextDay);
  const resetShift = useGameStore((s) => s.resetShift);

  if (!result) {
    return null;
  }

  const pass = result.passedSalaryGate && result.passedCompetencyGate;
  const salaryShortfall = Math.max(0, currentRules.salaryTarget - result.salary);
  const accuracyDelta = result.competency - currentRules.competencyTarget;
  const salaryDelta = result.salary - currentRules.salaryTarget;
  const fixYield = result.reworkAttempts === 0 ? 100 : Math.round((result.reworkSuccesses / result.reworkAttempts) * 100);
  const decisionErrorRate =
    result.processed === 0 ? 0 : Math.round(((result.falseAccepts + result.falseRejects) / result.processed) * 100);
  const canAdvanceDay = currentDay < 3;
  return (
    <div className="overlay-modal" role="dialog" aria-modal="true" aria-labelledby="debrief-title">
      <div className="overlay-card">
        <h2 id="debrief-title">End of Day {currentDay} Debrief</h2>
        <p className={`status-chip ${pass ? "status-ok" : "status-bad"}`}>
          {pass ? "Shift Passed" : "Remediation Required"}
        </p>
        <div className="debrief-metrics">
          <p>Processed wafers: {result.processed}</p>
          <p>
            Accuracy: {result.competency}% ({accuracyDelta >= 0 ? "+" : ""}
            {accuracyDelta}% vs target)
          </p>
          <p>
            Salary: ${result.salary} ({salaryDelta >= 0 ? "+" : ""}${salaryDelta} vs gate)
          </p>
          <p>Salary gate: {result.passedSalaryGate ? "Passed" : "Failed"}</p>
          <p>Competency gate: {result.passedCompetencyGate ? "Passed" : "Failed"}</p>
          <p>Decision error rate: {decisionErrorRate}%</p>
          <p>False accepts: {result.falseAccepts}</p>
          <p>False rejects: {result.falseRejects}</p>
          <p>
            Rework success: {result.reworkSuccesses}/{result.reworkAttempts} ({fixYield}%)
          </p>
          <p>First-try fix clears: {result.firstTryFixSuccesses}</p>
          <p>Quiz misses: {result.fixQuizFailures}</p>
          <p>Best combo streak: x{result.maxComboStreak}</p>
        </div>
        <h3>Coaching</h3>
        <ul>
          {salaryShortfall > 0 ? <li>Salary missed by ${salaryShortfall}. Keep one more clean wafer to clear gate.</li> : null}
          {result.falseAccepts > 0 ? <li>High-impact errors came from false accepts. Treat uncertain high-risk signatures as reject.</li> : null}
          {result.falseRejects > 0 ? <li>You are over-rejecting some recoverable wafers. Re-verify before final reject.</li> : null}
          {result.fixQuizFailures > 0 ? <li>Manual-fix quiz misses reduced fix throughput. Rehearse tool-to-defect mapping.</li> : null}
          {result.reworkAttempts > 0 && fixYield < 70 ? <li>Fix execution consistency is low; slow down and complete each simulation step cleanly.</li> : null}
          {result.maxComboStreak < 2 ? <li>Build short accuracy streaks first; combo bonuses significantly improve salary stability.</li> : null}
          {result.falseAccepts === 0 && result.falseRejects === 0 ? <li>Decision quality is stable. Next gain comes from faster clean completions.</li> : null}
        </ul>
        <div className="inline-row">
          {canAdvanceDay ? (
            <button type="button" onClick={advanceToNextDay}>
              Continue to Day {currentDay + 1}
            </button>
          ) : null}
          <button type="button" onClick={resetShift}>
            Restart Day 1
          </button>
        </div>
      </div>
    </div>
  );
}
