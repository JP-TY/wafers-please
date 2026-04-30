import type { DefectClass } from "@/game/types";

export type InspectionTool = "brightfield" | "darkfield" | "uv";
export type FixTool = "micro-polish" | "plasma-clean" | "laser-trim";

export const toolLabels: Record<InspectionTool, string> = {
  brightfield: "Brightfield",
  darkfield: "Darkfield",
  uv: "UV Scan"
};

export const fixToolLabels: Record<FixTool, string> = {
  "micro-polish": "Micro Polish",
  "plasma-clean": "Plasma Clean",
  "laser-trim": "Laser Trim"
};

export const optimalToolByDefect: Record<DefectClass, InspectionTool> = {
  particle: "darkfield",
  scratch: "brightfield",
  bridge: "uv",
  open: "uv",
  misalignment: "brightfield",
  benign: "brightfield"
};

export const fixToolByDefect: Record<DefectClass, FixTool> = {
  particle: "plasma-clean",
  scratch: "micro-polish",
  bridge: "laser-trim",
  open: "laser-trim",
  misalignment: "micro-polish",
  benign: "plasma-clean"
};
