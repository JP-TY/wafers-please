import type { DayRuleConfig, Disposition, ShiftResult, WaferCase } from "@/game/types";

export interface JudgementInput {
  wafer: WaferCase;
  action: Disposition;
  usedRework: boolean;
}

export interface ShiftAccumulator {
  processed: number;
  correctDecisions: number;
  falseAccepts: number;
  falseRejects: number;
  reworkAttempts: number;
  reworkSuccesses: number;
  firstTryFixSuccesses: number;
  fixQuizFailures: number;
  comboStreak: number;
  maxComboStreak: number;
  salary: number;
  streak: number;
}

export function createAccumulator(): ShiftAccumulator {
  return {
    processed: 0,
    correctDecisions: 0,
    falseAccepts: 0,
    falseRejects: 0,
    reworkAttempts: 0,
    reworkSuccesses: 0,
    firstTryFixSuccesses: 0,
    fixQuizFailures: 0,
    comboStreak: 0,
    maxComboStreak: 0,
    salary: 0,
    streak: 0
  };
}

export function applyJudgement(
  config: DayRuleConfig,
  acc: ShiftAccumulator,
  input: JudgementInput
): ShiftAccumulator {
  const next = { ...acc };
  next.processed += 1;

  const isCorrect = input.action === input.wafer.expectedDisposition;
  if (isCorrect) {
    next.correctDecisions += 1;
    next.streak += 1;
    next.salary += config.salary.basePerWafer;
    if (next.streak >= 3) {
      next.salary += config.salary.streakBonus;
    }
  } else {
    next.streak = 0;
    if (input.action === "accept" && input.wafer.expectedDisposition === "reject") {
      next.falseAccepts += 1;
      next.salary -= config.salary.falseAcceptFine;
    } else {
      next.falseRejects += 1;
      next.salary -= config.salary.wrongDecisionFine;
    }
  }

  if (isCorrect && input.usedRework) {
    next.comboStreak += 1;
    next.maxComboStreak = Math.max(next.maxComboStreak, next.comboStreak);
  } else if (!isCorrect) {
    next.comboStreak = 0;
  }

  if (input.usedRework) {
    next.reworkAttempts += 1;
    next.salary -= config.salary.reworkCost;
    if (input.wafer.reworkEligible && input.action !== "reject") {
      next.reworkSuccesses += 1;
    }
  }
  if (input.action === "accept" && input.wafer.reworkEligible && !input.usedRework) {
    next.salary -= config.salary.skipManualFixFine;
  }

  return next;
}

export function finalizeShift(config: DayRuleConfig, acc: ShiftAccumulator): ShiftResult {
  const competency =
    acc.processed === 0 ? 0 : Math.round((acc.correctDecisions / acc.processed) * 100);
  return {
    processed: acc.processed,
    correctDecisions: acc.correctDecisions,
    falseAccepts: acc.falseAccepts,
    falseRejects: acc.falseRejects,
    reworkAttempts: acc.reworkAttempts,
    reworkSuccesses: acc.reworkSuccesses,
    firstTryFixSuccesses: acc.firstTryFixSuccesses,
    fixQuizFailures: acc.fixQuizFailures,
    maxComboStreak: acc.maxComboStreak,
    salary: acc.salary,
    competency,
    passedSalaryGate: acc.salary >= config.salaryTarget,
    passedCompetencyGate: competency >= config.competencyTarget
  };
}
