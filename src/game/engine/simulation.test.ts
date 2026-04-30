import { describe, expect, it } from "vitest";
import { day1Rules } from "@/game/config/day1-rules";
import { generateWaferCase } from "@/game/engine/simulation";

describe("simulation engine", () => {
  it("is deterministic for same seed/day/index", () => {
    const a = generateWaferCase(day1Rules, 4, "stable-seed");
    const b = generateWaferCase(day1Rules, 4, "stable-seed");
    expect(a).toEqual(b);
  });

  it("creates different cases when index changes", () => {
    const a = generateWaferCase(day1Rules, 1, "stable-seed");
    const b = generateWaferCase(day1Rules, 2, "stable-seed");
    expect(a.id).not.toBe(b.id);
  });
});
