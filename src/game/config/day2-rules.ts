import type { DayRuleConfig } from "@/game/types";

export const day2Rules: DayRuleConfig = {
  day: 2,
  shiftSeconds: 320,
  wafersPerShift: 7,
  salaryTarget: 64,
  competencyTarget: 76,
  salary: {
    basePerWafer: 13,
    streakBonus: 4,
    wrongDecisionFine: 10,
    falseAcceptFine: 17,
    reworkCost: 1,
    skipManualFixFine: 3
  },
  enabledDefects: ["particle", "scratch", "misalignment", "bridge", "open", "benign"]
};
