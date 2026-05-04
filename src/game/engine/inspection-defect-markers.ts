import type { DefectClass, WaferCase } from "@/game/types";
import { seeded } from "@/game/engine/quiz-random";

export type DefectMarkerSpec = {
  x: number;
  y: number;
  rot: number;
  size: number;
  variant: number;
  defectClass: DefectClass;
};

type DefectRow = {
  defectClass: DefectClass;
  severity: number;
  defectLoad: number;
  defectPattern: number;
};

export function buildDefectMarkers(wafer: WaferCase, allDefects: DefectRow[]): DefectMarkerSpec[] {
  const count = Math.min(8, Math.max(1, wafer.defectLoad + wafer.secondaryDefects.length));
  return Array.from({ length: count }).map((_, index) => {
    const defect = allDefects[index % allDefects.length]!;
    const spread = defect.defectPattern === 4 ? 68 : defect.defectPattern === 3 ? 60 : defect.defectPattern === 2 ? 50 : 42;
    const x = 50 + (seeded(`${wafer.id}-${defect.defectClass}-${index}-x`) - 0.5) * spread;
    const y = 50 + (seeded(`${wafer.id}-${defect.defectClass}-${index}-y`) - 0.5) * spread;
    const rot = Math.round(seeded(`${wafer.id}-${defect.defectClass}-${index}-r`) * 180 - 90);
    const size =
      defect.defectClass === "particle"
        ? 10 + seeded(`${wafer.id}-${index}-s`) * 13
        : defect.defectClass === "scratch"
          ? 22 + seeded(`${wafer.id}-${index}-s`) * 30
          : 18 + seeded(`${wafer.id}-${index}-s`) * 22;
    const variant = ((index + wafer.defectPattern) % 3) + 1;
    return { x, y, rot, size, variant, defectClass: defect.defectClass };
  });
}
