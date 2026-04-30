"use client";

import { create } from "zustand";
import { getDayRules } from "@/game/config/day-rules";
import { defectCatalog } from "@/game/config/defects";
import {
  buildFixMiniGame,
  completeToolStep,
  failToolStep,
  registerFixMiniGameHit,
  registerFixMiniGameMiss,
  tickFixMiniGame
} from "@/game/engine/fix-mini-game";
import { createAccumulator, applyJudgement, finalizeShift } from "@/game/engine/scoring";
import { generateWaferCase } from "@/game/engine/simulation";
import { fixToolByDefect, type FixTool, type InspectionTool } from "@/game/inspection-tools";
import type { DayRuleConfig, Disposition, FixMiniGameState, ShiftResult, WaferCase } from "@/game/types";

type Phase = "running" | "ended";
type FixPhase = "idle" | "quiz" | "mini_game" | "applied";

interface GameState {
  currentDay: number;
  currentRules: DayRuleConfig;
  phase: Phase;
  seed: string;
  elapsedSeconds: number;
  waferIndex: number;
  currentWafer: WaferCase;
  accumulator: ReturnType<typeof createAccumulator>;
  result: ShiftResult | null;
  usedReworkOnCurrent: boolean;
  selectedTool: InspectionTool;
  selectedFixTool: FixTool;
  toolPickupNotice: string | null;
  inspectionOpen: boolean;
  hasInspectedCurrent: boolean;
  fixPhase: FixPhase;
  fixQuizAttemptsCurrent: number;
  fixMiniGame: FixMiniGameState | null;
  completedFixToolsCurrent: FixTool[];
  tutorialMilestones: {
    openedInspection: boolean;
    selectedViewTool: boolean;
    selectedFixTool: boolean;
    completedInspection: boolean;
    submittedDisposition: boolean;
  };
  setElapsedSeconds: (seconds: number) => void;
  openInspection: () => void;
  closeInspection: () => void;
  completeInspection: () => void;
  setSelectedTool: (tool: InspectionTool) => void;
  setSelectedFixTool: (tool: FixTool) => void;
  clearToolPickupNotice: () => void;
  startFixQuiz: () => void;
  submitFixQuizAttempt: (isCorrect: boolean) => void;
  startFixMiniGame: () => void;
  tickFixMiniGame: (nowMs: number) => void;
  registerFixMiniGameHit: (targetId: string, detail?: { timingOffset?: number }) => void;
  registerFixMiniGameMiss: (reason?: string) => void;
  completeToolStep: () => void;
  failToolStep: (reason?: string) => void;
  abortMiniGame: () => void;
  completeFixMiniGame: () => void;
  applyFix: () => void;
  markRework: () => void;
  actOnWafer: (action: Disposition) => void;
  advanceToNextDay: () => void;
  resetShift: () => void;
}

const initialSeed = "day-default-seed";
function makeRandomSeed(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `day-${crypto.randomUUID()}`;
  }
  return `day-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function makeInitialWafer(rules: DayRuleConfig, index = 0, seed = initialSeed): WaferCase {
  return generateWaferCase(rules, index, seed);
}

function getRequiredFixToolsForWafer(wafer: WaferCase): FixTool[] {
  if (!wafer.reworkEligible) return [];
  return Array.from(
    new Set(
      [wafer.defectClass, ...wafer.secondaryDefects.map((defect) => defect.defectClass)]
        .filter((defectClass) => defectCatalog[defectClass].reworkable)
        .map((defectClass) => fixToolByDefect[defectClass])
    )
  );
}

const bootSeed = makeRandomSeed();
const bootRules = getDayRules(1);

export const useGameStore = create<GameState>((set, get) => ({
  currentDay: 1,
  currentRules: bootRules,
  phase: "running",
  seed: bootSeed,
  elapsedSeconds: 0,
  waferIndex: 0,
  currentWafer: makeInitialWafer(bootRules, 0, bootSeed),
  accumulator: createAccumulator(),
  result: null,
  usedReworkOnCurrent: false,
  selectedTool: "brightfield",
  selectedFixTool: "micro-polish",
  toolPickupNotice: null,
  inspectionOpen: false,
  hasInspectedCurrent: false,
  fixPhase: "idle",
  fixQuizAttemptsCurrent: 0,
  fixMiniGame: null,
  completedFixToolsCurrent: [],
  tutorialMilestones: {
    openedInspection: false,
    selectedViewTool: false,
    selectedFixTool: false,
    completedInspection: false,
    submittedDisposition: false
  },
  setElapsedSeconds: (seconds) => {
    const state = get();
    if (state.phase === "ended") {
      return;
    }
    if (seconds >= state.currentRules.shiftSeconds) {
      const result = finalizeShift(state.currentRules, state.accumulator);
      set({ elapsedSeconds: state.currentRules.shiftSeconds, phase: "ended", result });
      return;
    }
    set({ elapsedSeconds: seconds });
  },
  openInspection: () => {
    if (get().phase !== "running") return;
    set((state) => ({
      inspectionOpen: true,
      tutorialMilestones: { ...state.tutorialMilestones, openedInspection: true }
    }));
  },
  closeInspection: () => {
    set({ inspectionOpen: false });
  },
  completeInspection: () => {
    if (get().phase !== "running") return;
    set((state) => ({
      hasInspectedCurrent: true,
      inspectionOpen: false,
      tutorialMilestones: { ...state.tutorialMilestones, completedInspection: true }
    }));
  },
  setSelectedTool: (tool) => {
    set((state) => ({
      selectedTool: tool,
      toolPickupNotice: `${tool.charAt(0).toUpperCase()}${tool.slice(1)} tool selected`,
      tutorialMilestones: { ...state.tutorialMilestones, selectedViewTool: true }
    }));
  },
  setSelectedFixTool: (tool) => {
    const readable = tool
      .split("-")
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(" ");
    set((state) => ({
      selectedFixTool: tool,
      toolPickupNotice: `${readable} selected for fix`,
      tutorialMilestones: { ...state.tutorialMilestones, selectedFixTool: true }
    }));
  },
  clearToolPickupNotice: () => {
    set({ toolPickupNotice: null });
  },
  startFixQuiz: () => {
    if (get().phase !== "running") return;
    set({ fixPhase: "quiz" });
  },
  submitFixQuizAttempt: (isCorrect) => {
    const state = get();
    if (state.phase !== "running") return;
    const accumulator = { ...state.accumulator };
    if (!isCorrect) {
      accumulator.fixQuizFailures += 1;
      set({
        accumulator,
        fixQuizAttemptsCurrent: state.fixQuizAttemptsCurrent + 1,
        toolPickupNotice: "Quiz answer incorrect. Review guidance."
      });
      return;
    }
    set({ fixQuizAttemptsCurrent: state.fixQuizAttemptsCurrent + 1 });
  },
  startFixMiniGame: () => {
    const state = get();
    if (state.phase !== "running") return;
    set({
      fixPhase: "mini_game",
      fixMiniGame: buildFixMiniGame(state.selectedFixTool, state.currentWafer, `${state.seed}-${state.waferIndex}`, Date.now())
    });
  },
  tickFixMiniGame: (nowMs) => {
    const state = get();
    if (state.phase !== "running" || !state.fixMiniGame) return;
    const next = tickFixMiniGame(state.fixMiniGame, nowMs);
    set({
      fixMiniGame: next,
      toolPickupNotice: next.phase === "failed" ? next.message : state.toolPickupNotice
    });
  },
  registerFixMiniGameHit: (targetId, detail) => {
    const state = get();
    if (state.phase !== "running" || !state.fixMiniGame) return;
    const next = registerFixMiniGameHit(state.fixMiniGame, targetId, detail);
    set({ fixMiniGame: next });
  },
  registerFixMiniGameMiss: (reason) => {
    const state = get();
    if (state.phase !== "running" || !state.fixMiniGame) return;
    set({ fixMiniGame: registerFixMiniGameMiss(state.fixMiniGame, reason) });
  },
  completeToolStep: () => {
    const state = get();
    if (state.phase !== "running" || !state.fixMiniGame) return;
    set({ fixMiniGame: completeToolStep(state.fixMiniGame) });
  },
  failToolStep: (reason) => {
    const state = get();
    if (state.phase !== "running" || !state.fixMiniGame) return;
    set({ fixMiniGame: failToolStep(state.fixMiniGame, reason) });
  },
  abortMiniGame: () => {
    if (get().phase !== "running") return;
    set({
      fixPhase: "quiz",
      fixMiniGame: null,
      toolPickupNotice: "Manual fix simulation cancelled."
    });
  },
  completeFixMiniGame: () => {
    const state = get();
    if (state.phase !== "running") return;
    if (!state.fixMiniGame || state.fixMiniGame.phase !== "success") {
      set({ toolPickupNotice: "Complete the tool mini-game successfully before applying fix." });
      return;
    }
    get().applyFix();
  },
  applyFix: () => {
    const state = get();
    if (state.phase !== "running") {
      return;
    }
    if (!state.currentWafer.reworkEligible) {
      set({ toolPickupNotice: "No manual fix needed for this wafer" });
      return;
    }
    const requiredFixTools = getRequiredFixToolsForWafer(state.currentWafer);
    if (!requiredFixTools.includes(state.selectedFixTool)) {
      set({ toolPickupNotice: "Wrong fix tool selected for observed defect mechanism" });
      return;
    }
    const accumulator = { ...state.accumulator };
    if (state.fixQuizAttemptsCurrent <= 1) {
      accumulator.firstTryFixSuccesses += 1;
      accumulator.comboStreak += 1;
      accumulator.maxComboStreak = Math.max(accumulator.maxComboStreak, accumulator.comboStreak);
    }
    const completedFixToolsCurrent = Array.from(new Set([...state.completedFixToolsCurrent, state.selectedFixTool]));
    const allRequiredToolsCompleted = requiredFixTools.every((tool) => completedFixToolsCurrent.includes(tool));
    set({
      usedReworkOnCurrent: allRequiredToolsCompleted,
      fixPhase: allRequiredToolsCompleted ? "applied" : "idle",
      fixMiniGame: null,
      completedFixToolsCurrent,
      toolPickupNotice: allRequiredToolsCompleted
        ? "Manual fixes complete"
        : "Partial fix applied. Switch to remaining required fix tool.",
      accumulator
    });
  },
  markRework: () => {
    get().applyFix();
  },
  actOnWafer: (action) => {
    const state = get();
    if (state.phase !== "running") {
      return;
    }
    const requiredFixTools = getRequiredFixToolsForWafer(state.currentWafer);
    const allRequiredToolsCompleted = requiredFixTools.every((tool) => state.completedFixToolsCurrent.includes(tool));
    if (action === "accept" && requiredFixTools.length > 0 && !allRequiredToolsCompleted) {
      set({
        toolPickupNotice: "All fixable defect mechanisms must be repaired before accepting this wafer."
      });
      return;
    }
    const updated = applyJudgement(state.currentRules, state.accumulator, {
      wafer: state.currentWafer,
      action,
      usedRework: state.usedReworkOnCurrent
    });

    const nextIndex = state.waferIndex + 1;
    const projectedElapsed = Math.min(
      state.elapsedSeconds + (state.usedReworkOnCurrent ? 24 : 14),
      state.currentRules.shiftSeconds
    );
    const endedByTime = projectedElapsed >= state.currentRules.shiftSeconds;
    const endedByCount = nextIndex >= state.currentRules.wafersPerShift;
    const ended = endedByTime || endedByCount;
    set({
      accumulator: updated,
      elapsedSeconds: projectedElapsed,
      waferIndex: nextIndex,
      currentWafer: makeInitialWafer(state.currentRules, nextIndex, state.seed),
      usedReworkOnCurrent: false,
      selectedTool: "brightfield",
      selectedFixTool: "micro-polish",
      inspectionOpen: false,
      hasInspectedCurrent: false,
      fixPhase: "idle",
      fixQuizAttemptsCurrent: 0,
      fixMiniGame: null,
      completedFixToolsCurrent: [],
      tutorialMilestones: { ...state.tutorialMilestones, submittedDisposition: true },
      phase: ended ? "ended" : "running",
      result: ended ? finalizeShift(state.currentRules, updated) : null,
      toolPickupNotice:
        action === "accept" && state.currentWafer.reworkEligible && !state.usedReworkOnCurrent
          ? `Accepted without manual fix (-$${state.currentRules.salary.skipManualFixFine})`
          : null
    });
  },
  advanceToNextDay: () => {
    const state = get();
    const nextDay = Math.min(3, state.currentDay + 1);
    const nextRules = getDayRules(nextDay);
    const seed = makeRandomSeed();
    set({
      currentDay: nextDay,
      currentRules: nextRules,
      phase: "running",
      seed,
      elapsedSeconds: 0,
      waferIndex: 0,
      currentWafer: makeInitialWafer(nextRules, 0, seed),
      accumulator: createAccumulator(),
      usedReworkOnCurrent: false,
      selectedTool: "brightfield",
      selectedFixTool: "micro-polish",
      toolPickupNotice: `Day ${nextDay} started`,
      inspectionOpen: false,
      hasInspectedCurrent: false,
      fixPhase: "idle",
      fixQuizAttemptsCurrent: 0,
      fixMiniGame: null,
      completedFixToolsCurrent: [],
      tutorialMilestones: {
        openedInspection: false,
        selectedViewTool: false,
        selectedFixTool: false,
        completedInspection: false,
        submittedDisposition: false
      },
      result: null
    });
  },
  resetShift: () => {
    const nextRules = getDayRules(1);
    const seed = makeRandomSeed();
    set({
      currentDay: 1,
      currentRules: nextRules,
      phase: "running",
      seed,
      elapsedSeconds: 0,
      waferIndex: 0,
      currentWafer: makeInitialWafer(nextRules, 0, seed),
      accumulator: createAccumulator(),
      usedReworkOnCurrent: false,
      selectedTool: "brightfield",
      selectedFixTool: "micro-polish",
      toolPickupNotice: null,
      inspectionOpen: false,
      hasInspectedCurrent: false,
      fixPhase: "idle",
      fixQuizAttemptsCurrent: 0,
      fixMiniGame: null,
      completedFixToolsCurrent: [],
      tutorialMilestones: {
        openedInspection: false,
        selectedViewTool: false,
        selectedFixTool: false,
        completedInspection: false,
        submittedDisposition: false
      },
      result: null
    });
  }
}));
