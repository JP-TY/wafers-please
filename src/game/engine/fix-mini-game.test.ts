import { describe, expect, it } from "vitest";
import { buildFixMiniGame, registerFixMiniGameHit, registerFixMiniGameMiss, tickFixMiniGame } from "@/game/engine/fix-mini-game";
import type { WaferCase } from "@/game/types";

const waferFixture: WaferCase = {
  id: "W-1-1",
  defectClass: "scratch",
  severity: 2,
  defectLoad: 3,
  defectPattern: 2,
  secondaryDefects: [{ defectClass: "particle", severity: 1, defectLoad: 2, defectPattern: 1 }],
  reworkEligible: true,
  expectedDisposition: "accept"
};

describe("fix mini-game engine", () => {
  it("builds deterministic tool scenarios", () => {
    const first = buildFixMiniGame("micro-polish", waferFixture, "seed-1", 1000);
    const second = buildFixMiniGame("micro-polish", waferFixture, "seed-1", 1000);
    expect(first.targets).toEqual(second.targets);
    expect(first.difficulty).toEqual(second.difficulty);
  });

  it("fails after too many misses", () => {
    const initial = buildFixMiniGame("laser-trim", waferFixture, "seed-2", 1000);
    const miss1 = registerFixMiniGameMiss(initial);
    const miss2 = registerFixMiniGameMiss(miss1);
    const miss3 = registerFixMiniGameMiss(miss2);
    const miss4 = registerFixMiniGameMiss(miss3);
    const miss5 = registerFixMiniGameMiss(miss4);
    expect(miss5.phase).toBe("failed");
  });

  it("marks polish game success after ordered hits", () => {
    let state = buildFixMiniGame("micro-polish", waferFixture, "seed-3", 1000);
    for (const target of state.targets) {
      state = registerFixMiniGameHit(state, target.id);
      state = registerFixMiniGameHit(state, target.id);
    }
    expect(state.phase).toBe("success");
    expect(state.progress).toBe(100);
  });

  it("regenerates plasma contamination over time", () => {
    const initial = buildFixMiniGame("plasma-clean", waferFixture, "seed-5", 1000);
    const hit = registerFixMiniGameHit(initial, initial.targets[0]?.id ?? "");
    const ticked = tickFixMiniGame(hit, 1600);
    expect(ticked.targets[0]?.progress).toBeGreaterThanOrEqual(hit.targets[0]?.progress ?? 0);
  });

  it("rejects laser hit outside timing window", () => {
    const initial = buildFixMiniGame("laser-trim", waferFixture, "seed-6", 1000);
    const firstTarget = initial.targets[0];
    const missed = registerFixMiniGameHit(initial, firstTarget?.id ?? "", { timingOffset: 0.99 });
    expect(missed.failures).toBeGreaterThan(0);
  });

  it("times out when elapsed exceeds limit", () => {
    const initial = buildFixMiniGame("plasma-clean", waferFixture, "seed-4", 1000);
    const timedOut = tickFixMiniGame(initial, 1000 + initial.timeLimitMs + 1);
    expect(timedOut.phase).toBe("failed");
  });
});
