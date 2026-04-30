import type { DayRuleConfig } from "@/game/types";

export const day3Rules: DayRuleConfig = {
  day: 3,
  shiftSeconds: 340,
  wafersPerShift: 9,
  salaryTarget: 96,
  competencyTarget: 82,
  salary: {
    basePerWafer: 14,
    streakBonus: 5,
    wrongDecisionFine: 12,
    falseAcceptFine: 20,
    reworkCost: 2,
    skipManualFixFine: 4
  },
  enabledDefects: ["particle", "scratch", "misalignment", "bridge", "open", "benign"]
};
