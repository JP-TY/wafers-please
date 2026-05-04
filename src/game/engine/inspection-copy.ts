import type { DispositionGuidance } from "@/game/engine/decision-thresholds";
import type { FixTool, InspectionTool } from "@/game/inspection-tools";
import { fixToolLabels, toolLabels } from "@/game/inspection-tools";

/** Static inspector guide paragraphs (same substance as InspectionModal). */
export const INSPECTOR_GUIDE_LINES = [
  "Interpretation: observe, cross-check in at least two modes, then decide from repeatable evidence.",
  "Particle-like: small scattered points that brighten with angle; often clustered.",
  "Line/mechanical: elongated marks that persist while rotating the wafer.",
  "Connectivity-risk: discontinuities or unintended links stable across views.",
  "Benign/cosmetic: low-intensity marks that fade when cross-checked.",
  "Disposition rule: accept when risk stays low after verification; repair when fixable; reject when severe risk remains."
] as const;

export const MANUAL_FIX_GUIDE_LINES = [
  "Micro Polish: shallow/mechanical marks (fine scratches, edge scuff).",
  "Plasma Clean: particulate/film-like (speckle, haze, residue scatter).",
  "Laser Trim: continuity issues (bridge/open-like signatures).",
  "Flow: pick tool → pass verification → clear all repair nodes → re-inspect in two modes before disposition."
] as const;

export function buildInspectionFindingsPages(args: {
  tool: InspectionTool;
  selectedFixTool: FixTool;
  inspectionConfidence: number;
  requiredThreshold: number;
  currentDay: number;
  dispositionGuidance: DispositionGuidance;
  requiredFixTools: FixTool[];
  pendingFixTools: FixTool[];
  canRevealDefect: boolean;
}): string[] {
  const {
    tool,
    selectedFixTool,
    inspectionConfidence,
    requiredThreshold,
    currentDay,
    dispositionGuidance,
    requiredFixTools,
    pendingFixTools,
    canRevealDefect
  } = args;

  const p0 = [
    `Findings — View: ${toolLabels[tool]} | Fix: ${fixToolLabels[selectedFixTool]}`,
    `Confidence ${inspectionConfidence}% (need ${requiredThreshold}%)`,
    canRevealDefect ? "Evidence visible in this view." : "Insufficient evidence in this view — switch tool or adjust view."
  ].join("\n");

  const p1 = [`Risk band: ${dispositionGuidance.riskBand}`, ...INSPECTOR_GUIDE_LINES.slice(0, 3)].join("\n");

  const p2 = [
    ...INSPECTOR_GUIDE_LINES.slice(3),
    currentDay === 1 && dispositionGuidance.dispositionCall
      ? `Current call: ${dispositionGuidance.dispositionCall}`
      : ""
  ]
    .filter(Boolean)
    .join("\n");

  const hintsTitle = currentDay === 3 ? "Minimal hint" : "Reasoning hints";
  const p3 = [
    `${hintsTitle}:`,
    ...dispositionGuidance.visualSignals.map((s) => `• ${s}`),
    currentDay <= 2 ? `\nWhy this call:\n${dispositionGuidance.notes.map((n) => `• ${n}`).join("\n")}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  const p4 = ["Manual fix guide:", ...MANUAL_FIX_GUIDE_LINES].join("\n");

  const pages = [p0, p1, p2, p3, p4];
  if (requiredFixTools.length > 1) {
    pages.push(
      [
        "Multi-defect repair: complete every required tool pass before accept.",
        `Remaining: ${pendingFixTools.length > 0 ? pendingFixTools.map((t) => fixToolLabels[t]).join(", ") : "None"}`
      ].join("\n")
    );
  }
  return pages;
}
