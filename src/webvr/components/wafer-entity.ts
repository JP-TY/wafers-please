import type { WaferCase } from "@/game/types";

const defectColorMap: Record<WaferCase["defectClass"], string> = {
  particle: "#d5edff",
  scratch: "#ffd2a8",
  bridge: "#ff8c8c",
  open: "#ffb5ff",
  misalignment: "#fceca1",
  benign: "#9df2c5"
};

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

export function getWaferVisuals(wafer: WaferCase): {
  ringColor: string;
  markerScale: string;
  markerPos: string;
} {
  const x = (seeded(`${wafer.id}-mx`) - 0.5) * 0.44;
  const z = (seeded(`${wafer.id}-mz`) - 0.5) * 0.42 - 2.95;
  return {
    ringColor: defectColorMap[wafer.defectClass],
    markerScale: wafer.severity === 3 ? "0.25 0.25 0.25" : wafer.severity === 2 ? "0.2 0.2 0.2" : "0.15 0.15 0.15",
    markerPos: `${x.toFixed(3)} 1.086 ${z.toFixed(3)}`
  };
}
