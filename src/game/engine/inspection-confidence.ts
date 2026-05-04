import type { InspectionTool } from "@/game/inspection-tools";
import type { WaferCase } from "@/game/types";

export function computeInspectionConfidence(args: {
  wafer: WaferCase;
  zoom: number;
  rotation: { x: number; y: number };
  canRevealDefect: boolean;
  visibleDefectCount: number;
  totalDefectCount: number;
  tool: InspectionTool;
  recommendedTool: InspectionTool;
}): { inspectionConfidence: number; requiredThreshold: number; canMarkComplete: boolean } {
  const { wafer, zoom, rotation, canRevealDefect, visibleDefectCount, totalDefectCount, tool, recommendedTool } = args;
  const requiredThreshold =
    wafer.severity === 3 || wafer.defectClass === "bridge" || wafer.defectClass === "open" ? 78 : 64;
  const zoomScore = Math.max(0, Math.min(30, Math.round((zoom - 0.8) * 20)));
  const angleDelta = Math.abs(rotation.x - 10) + Math.abs(rotation.y + 20);
  const angleScore = Math.min(18, Math.round(angleDelta / 4));
  const signalScore = canRevealDefect
    ? Math.min(32, 8 + Math.round((visibleDefectCount / Math.max(1, totalDefectCount)) * 24))
    : 8;
  const toolScore = tool === recommendedTool ? 20 : 5;
  const inspectionConfidence = Math.min(100, zoomScore + angleScore + signalScore + toolScore);
  return {
    inspectionConfidence,
    requiredThreshold,
    canMarkComplete: inspectionConfidence >= requiredThreshold
  };
}
