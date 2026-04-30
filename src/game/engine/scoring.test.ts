import { describe, expect, it } from "vitest";
import { day1Rules } from "@/game/config/day1-rules";
import { applyJudgement, createAccumulator, finalizeShift } from "@/game/engine/scoring";
import type { WaferCase } from "@/game/types";

const rejectWafer: WaferCase = {
  id: "W-1",
  defectClass: "bridge",
  severity: 3,
  defectLoad: 5,
  defectPattern: 4,
  secondaryDefects: [],
  reworkEligible: false,
  expectedDisposition: "reject"
};

describe("scoring engine", () => {
  it("penalizes false accept with heavier fine", () => {
    const initial = createAccumulator();
    const updated = applyJudgement(day1Rules, initial, {
      wafer: rejectWafer,
      action: "accept",
      usedRework: false
    });
    expect(updated.falseAccepts).toBe(1);
    expect(updated.salary).toBe(-day1Rules.salary.falseAcceptFine);
  });

  it("computes competency percentage from processed decisions", () => {
    const initial = createAccumulator();
    const afterCorrect = applyJudgement(day1Rules, initial, {
      wafer: rejectWafer,
      action: "reject",
      usedRework: false
    });
    const afterWrong = applyJudgement(day1Rules, afterCorrect, {
      wafer: rejectWafer,
      action: "accept",
      usedRework: false
    });
    const result = finalizeShift(day1Rules, afterWrong);
    expect(result.processed).toBe(2);
    expect(result.competency).toBe(50);
  });

  it("applies small salary penalty when accepting without manual fix", () => {
    const initial = createAccumulator();
    const fixableWafer: WaferCase = {
      ...rejectWafer,
      id: "W-fixable",
      expectedDisposition: "accept",
      reworkEligible: true,
      severity: 2,
      defectLoad: 3,
      defectClass: "scratch"
    };
    const updated = applyJudgement(day1Rules, initial, {
      wafer: fixableWafer,
      action: "accept",
      usedRework: false
    });
    expect(updated.salary).toBe(day1Rules.salary.basePerWafer - day1Rules.salary.skipManualFixFine);
  });
});
