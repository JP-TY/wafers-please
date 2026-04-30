import type { DayRuleConfig } from "@/game/types";

export const day1Rules: DayRuleConfig = {
  day: 1,
  shiftSeconds: 300,
  wafersPerShift: 5,
  salaryTarget: 36,
  competencyTarget: 70,
  salary: {
    basePerWafer: 12,
    streakBonus: 3,
    wrongDecisionFine: 8,
    falseAcceptFine: 14,
    reworkCost: 0,
    skipManualFixFine: 2
  },
  enabledDefects: ["particle", "scratch", "misalignment", "benign"]
};
