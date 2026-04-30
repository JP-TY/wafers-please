import type { Disposition, WaferCase } from "@/game/types";

export interface DispositionGuidance {
  recommendedAction: Disposition;
  riskBand: "low" | "moderate" | "high" | "critical";
  dispositionCall?: string;
  visualSignals: string[];
  notes: string[];
}

type HintMode = "full" | "reasoning" | "minimal";

function getHintMode(day: number): HintMode {
  if (day <= 1) return "full";
  if (day === 2) return "reasoning";
  return "minimal";
}

export function getDispositionGuidance(wafer: WaferCase, day = 1): DispositionGuidance {
  const hintMode = getHintMode(day);
  const severityThresholdReject = 3;
  const loadThresholdReject = 4;
  const hasConnectivityRisk = wafer.defectClass === "bridge" || wafer.defectClass === "open";
  const hasHighSeveritySecondary = wafer.secondaryDefects.some((defect) => defect.severity >= severityThresholdReject);
  const hasHighLoadSecondary = wafer.secondaryDefects.some((defect) => defect.defectLoad >= loadThresholdReject);

  const notes: string[] = [];
  if (hasConnectivityRisk) {
    notes.push("Connectivity-risk defect type detected.");
  }
  if (wafer.severity >= severityThresholdReject || hasHighSeveritySecondary) {
    notes.push(`Severity threshold hit (>= ${severityThresholdReject}).`);
  }
  if (wafer.defectLoad >= loadThresholdReject || hasHighLoadSecondary) {
    notes.push(`Defect load threshold hit (>= ${loadThresholdReject}).`);
  }
  if (wafer.reworkEligible) {
    notes.push("Manual fix path is available before final disposition.");
  } else {
    notes.push("No safe manual-fix path available for this wafer.");
  }

  if (hasConnectivityRisk || wafer.severity >= severityThresholdReject || wafer.defectLoad >= loadThresholdReject) {
    return {
      recommendedAction: "reject",
      riskBand: hasConnectivityRisk ? "critical" : "high",
      dispositionCall: hintMode === "full" ? "Stop and reject" : undefined,
      visualSignals:
        hintMode === "minimal"
          ? ["Persistent high-risk signature"]
          : [
              "Red/pink persistent structures",
              "Dense or repeated defect cluster",
              "Pattern continuity appears unstable"
            ],
      notes:
        hintMode === "minimal"
          ? ["Escalate if unstable after re-check."]
          : notes
    };
  }

  if (wafer.reworkEligible && (wafer.severity >= 2 || wafer.defectLoad >= 3)) {
    return {
      recommendedAction: "rework",
      riskBand: "moderate",
      dispositionCall: hintMode === "full" ? "Fix, re-check, then decide" : undefined,
      visualSignals:
        hintMode === "minimal"
          ? ["Localized persistent signature"]
          : [
              "Localized but persistent marks",
              "Medium defect spread",
              "Signal remains after view switching"
            ],
      notes: hintMode === "minimal" ? ["Stability after intervention decides release."] : notes
    };
  }

  return {
    recommendedAction: "accept",
    riskBand: "low",
    dispositionCall: hintMode === "full" ? "Accept with confidence" : undefined,
    visualSignals:
      hintMode === "minimal"
        ? ["Low-signal, stable appearance"]
        : [
            "Sparse, faint, non-structured marks",
            "No continuity break visual",
            "Stable clean look across views"
          ],
    notes: hintMode === "minimal" ? ["Proceed only if multi-view check stays stable."] : notes
  };
}
