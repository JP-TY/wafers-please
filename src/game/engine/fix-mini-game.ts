import type { FixTool } from "@/game/inspection-tools";
import type { FixMiniGameState, FixMiniGameTarget, WaferCase } from "@/game/types";

function hashString(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seeded(seed: string): number {
  return (hashString(seed) % 10000) / 10000;
}

export function buildFixMiniGame(tool: FixTool, wafer: WaferCase, scenarioSeed: string, nowMs: number): FixMiniGameState {
  const severityPressure = wafer.severity;
  const loadPressure = wafer.defectLoad;
  const baseTargetCount = Math.min(6, 3 + Math.floor(loadPressure / 3) + (severityPressure >= 3 ? 1 : 0));
  const targetCount = tool === "laser-trim" ? Math.min(5, baseTargetCount) : baseTargetCount;
  const maxMisses =
    tool === "laser-trim"
      ? Math.max(2, 4 - Math.floor(severityPressure / 3))
      : tool === "plasma-clean"
        ? Math.max(3, 5 - Math.floor(severityPressure / 3))
        : Math.max(3, 6 - Math.floor(severityPressure / 3));
  const speed =
    (tool === "laser-trim" ? 1.04 : tool === "plasma-clean" ? 0.98 : 0.86) +
    (loadPressure - 1) * 0.08 +
    (severityPressure - 1) * 0.1;
  const timeLimitMs =
    tool === "laser-trim"
      ? Math.max(11000, 21000 - loadPressure * 1100 - severityPressure * 950)
      : tool === "plasma-clean"
        ? Math.max(12000, 21500 - loadPressure * 950 - severityPressure * 800)
        : Math.max(13000, 23000 - loadPressure * 850 - severityPressure * 650);
  const targets: FixMiniGameTarget[] = Array.from({ length: targetCount }).map((_, idx) => {
    const x = 16 + seeded(`${scenarioSeed}-${tool}-${idx}-x`) * 68;
    const y = 18 + seeded(`${scenarioSeed}-${tool}-${idx}-y`) * 64;
    const radius = tool === "micro-polish" ? 10 : tool === "plasma-clean" ? 12 : 11;
    if (tool === "laser-trim") {
      return {
        id: `${tool}-${idx}`,
        x,
        y,
        radius,
        progress: 0,
        cleared: false,
        windowCenter: 0.5 + (seeded(`${scenarioSeed}-${idx}-wc`) - 0.5) * 0.3,
        windowSize: 0.12 + seeded(`${scenarioSeed}-${idx}-ws`) * 0.08,
        drift: (seeded(`${scenarioSeed}-${idx}-dr`) - 0.5) * 0.004
      };
    }
    return {
      id: `${tool}-${idx}`,
      x,
      y,
      radius,
      progress: tool === "plasma-clean" ? 100 : 0,
      cleared: false
    };
  });

  return {
    tool,
    phase: "active",
    difficulty: { targetCount, maxMisses, speed },
    progress: 0,
    failures: 0,
    startedAt: nowMs,
    elapsedMs: 0,
    timeLimitMs,
    targets,
    currentTargetIndex: 0,
    message:
      tool === "micro-polish"
        ? "Trace each polish checkpoint in sequence."
        : tool === "plasma-clean"
          ? "Sweep contamination clusters before purge timeout."
          : "Pulse when target timing windows align."
  };
}

export function tickFixMiniGame(state: FixMiniGameState, nowMs: number): FixMiniGameState {
  if (state.phase !== "active") return state;
  const elapsedMs = nowMs - state.startedAt;
  if (elapsedMs >= state.timeLimitMs) {
    return { ...state, elapsedMs, phase: "failed", message: "Repair window expired. Reattempt required." };
  }
  if (state.tool === "plasma-clean") {
    const nextTargets = state.targets.map((target, idx) => {
      if (target.cleared) return target;
      const regenRate = 0.42 * state.difficulty.speed;
      const phase = elapsedMs / 1000;
      const driftX = Math.sin(phase * (0.9 + idx * 0.15)) * 0.22 * state.difficulty.speed;
      const driftY = Math.cos(phase * (0.8 + idx * 0.12)) * 0.18 * state.difficulty.speed;
      return {
        ...target,
        progress: Math.min(100, target.progress + regenRate),
        x: Math.min(88, Math.max(12, target.x + driftX)),
        y: Math.min(86, Math.max(14, target.y + driftY))
      };
    });
    return { ...state, elapsedMs, targets: nextTargets };
  }
  if (state.tool === "laser-trim") {
    const nextTargets = state.targets.map((target, idx) => {
      if (target.cleared || typeof target.windowCenter !== "number") return target;
      const drift = (target.drift ?? 0) * state.difficulty.speed;
      const nextCenter = target.windowCenter + drift;
      if (nextCenter < 0.2 || nextCenter > 0.8) {
        const bounce = -drift;
        return { ...target, windowCenter: Math.max(0.2, Math.min(0.8, nextCenter)), drift: bounce };
      }
      const swing = Math.sin((elapsedMs / 850) + idx) * 0.012;
      return { ...target, windowCenter: Math.max(0.2, Math.min(0.8, nextCenter + swing)) };
    });
    return { ...state, elapsedMs, targets: nextTargets };
  }
  return { ...state, elapsedMs };
}

export function registerFixMiniGameHit(
  state: FixMiniGameState,
  targetId: string,
  detail?: { timingOffset?: number }
): FixMiniGameState {
  if (state.phase !== "active") return state;
  const targetIndex = state.targets.findIndex((target) => target.id === targetId);
  if (targetIndex < 0) return state;

  if (state.tool === "micro-polish" && targetIndex !== state.currentTargetIndex) {
    return registerFixMiniGameMiss(state, "Follow the polish sequence order.");
  }

  const nextTargets = state.targets.map((target, idx) => {
    if (idx !== targetIndex) return target;
    if (state.tool === "plasma-clean") {
      const nextProgress = Math.max(0, target.progress - (40 + state.difficulty.speed * 4));
      return { ...target, progress: nextProgress, cleared: nextProgress <= 0 };
    }
    if (state.tool === "laser-trim") {
      const offset = Math.abs(detail?.timingOffset ?? 1);
      const accepted = offset <= (target.windowSize ?? 0.12);
      return accepted ? { ...target, progress: 100, cleared: true } : target;
    }
    const nextProgress = Math.min(100, target.progress + 55);
    return { ...target, progress: nextProgress, cleared: nextProgress >= 100 };
  });

  if (state.tool === "laser-trim") {
    const changed = nextTargets[targetIndex];
    if (!changed?.cleared) {
      return registerFixMiniGameMiss(state, "Pulse missed timing gate.");
    }
  }

  const clearedCount = nextTargets.filter((target) => target.cleared).length;
  const progress = Math.round((clearedCount / Math.max(1, nextTargets.length)) * 100);
  const nextIndex =
    state.tool === "micro-polish"
      ? Math.min(state.currentTargetIndex + (nextTargets[targetIndex]?.cleared ? 1 : 0), nextTargets.length - 1)
      : state.currentTargetIndex;
  const completed = progress >= 100;

  return {
    ...state,
    targets: nextTargets,
    progress,
    currentTargetIndex: nextIndex,
    phase: completed ? "success" : "active",
    message: completed ? "Tool pass complete. Ready to apply fix." : state.message
  };
}

export function registerFixMiniGameMiss(state: FixMiniGameState, reason = "Repair interaction missed."): FixMiniGameState {
  if (state.phase !== "active") return state;
  const failures = state.failures + 1;
  if (failures > state.difficulty.maxMisses) {
    return { ...state, failures, phase: "failed", message: "Too many misses. Reattempt required." };
  }
  return { ...state, failures, message: reason };
}

export function completeToolStep(state: FixMiniGameState): FixMiniGameState {
  if (state.phase !== "active") return state;
  const progress = Math.min(100, state.progress + 20);
  return { ...state, progress, phase: progress >= 100 ? "success" : "active" };
}

export function failToolStep(state: FixMiniGameState, reason = "Tool step failed."): FixMiniGameState {
  return registerFixMiniGameMiss(state, reason);
}
