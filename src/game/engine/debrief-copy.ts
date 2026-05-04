import type { DayRuleConfig, ShiftResult } from "@/game/types";

export function buildDebriefMetricLines(result: ShiftResult, currentRules: DayRuleConfig, currentDay: number): string[] {
  const pass = result.passedSalaryGate && result.passedCompetencyGate;
  const salaryShortfall = Math.max(0, currentRules.salaryTarget - result.salary);
  const accuracyDelta = result.competency - currentRules.competencyTarget;
  const salaryDelta = result.salary - currentRules.salaryTarget;
  const fixYield = result.reworkAttempts === 0 ? 100 : Math.round((result.reworkSuccesses / result.reworkAttempts) * 100);
  const decisionErrorRate =
    result.processed === 0 ? 0 : Math.round(((result.falseAccepts + result.falseRejects) / result.processed) * 100);

  return [
    `End of Day ${currentDay} — ${pass ? "Shift Passed" : "Remediation Required"}`,
    `Processed: ${result.processed}`,
    `Accuracy: ${result.competency}% (${accuracyDelta >= 0 ? "+" : ""}${accuracyDelta}% vs ${currentRules.competencyTarget}%)`,
    `Salary: $${result.salary} (${salaryDelta >= 0 ? "+" : ""}$${salaryDelta} vs $${currentRules.salaryTarget})`,
    `Salary gate: ${result.passedSalaryGate ? "Passed" : "Failed"}`,
    `Competency gate: ${result.passedCompetencyGate ? "Passed" : "Failed"}`,
    `Decision error rate: ${decisionErrorRate}%`,
    `False accepts: ${result.falseAccepts} | False rejects: ${result.falseRejects}`,
    `Rework: ${result.reworkSuccesses}/${result.reworkAttempts} (${fixYield}%)`,
    `First-try fix clears: ${result.firstTryFixSuccesses}`,
    `Quiz misses: ${result.fixQuizFailures} | Best combo: x${result.maxComboStreak}`,
    salaryShortfall > 0 ? `Salary short by $${salaryShortfall}.` : ""
  ].filter(Boolean);
}

export function buildDebriefCoachingLines(result: ShiftResult, currentRules: DayRuleConfig): string[] {
  const salaryShortfall = Math.max(0, currentRules.salaryTarget - result.salary);
  const fixYield = result.reworkAttempts === 0 ? 100 : Math.round((result.reworkSuccesses / result.reworkAttempts) * 100);
  const lines: string[] = [];
  if (salaryShortfall > 0) {
    lines.push(`Salary missed by $${salaryShortfall}. Keep one more clean wafer to clear gate.`);
  }
  if (result.falseAccepts > 0) {
    lines.push("False accepts: treat uncertain high-risk signatures as reject.");
  }
  if (result.falseRejects > 0) {
    lines.push("False rejects: re-verify before final reject.");
  }
  if (result.fixQuizFailures > 0) {
    lines.push("Fix quiz misses: rehearse tool-to-defect mapping.");
  }
  if (result.reworkAttempts > 0 && fixYield < 70) {
    lines.push("Fix consistency low; complete each simulation step cleanly.");
  }
  if (result.maxComboStreak < 2) {
    lines.push("Build accuracy streaks; combo bonuses stabilize salary.");
  }
  if (result.falseAccepts === 0 && result.falseRejects === 0) {
    lines.push("Decision quality stable; next gain is faster clean completions.");
  }
  return lines;
}
