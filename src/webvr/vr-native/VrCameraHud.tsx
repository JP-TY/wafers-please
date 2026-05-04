"use client";

import { createElement as h } from "react";
import { fixToolLabels, toolLabels } from "@/game/inspection-tools";
import { useGameStore } from "@/game/store/game-store";
import { CAM_UI_TABLET_SCALE } from "@/webvr/vr-native/vr-layout-constants";
import { truncateForVrText } from "@/webvr/vr-native/vr-text-utils";

function statChip(args: { key: string; label: string; value: string; position: string; accent?: string }) {
  return h("a-entity", { key: args.key, position: args.position }, [
    h("a-plane", {
      key: "bg",
      position: "0 0 -0.004",
      width: 0.24,
      height: 0.052,
      color: "#0f1a26",
      opacity: 0.92,
      transparent: true,
      shader: "flat"
    }),
    h("a-text", {
      key: "lb",
      position: "0 0.014 0.002",
      value: args.label,
      width: 2.2,
      align: "center",
      color: "#7a9ab4"
    }),
    h("a-text", {
      key: "val",
      position: "0 -0.012 0.002",
      value: truncateForVrText(args.value, 28),
      width: 1.35,
      align: "center",
      color: args.accent ?? "#e8f4ff"
    })
  ]);
}

/** Head-mounted status chips (readable at arm's length). */
export function VrCameraHud() {
  const currentDay = useGameStore((s) => s.currentDay);
  const wafer = useGameStore((s) => s.currentWafer);
  const hasInspected = useGameStore((s) => s.hasInspectedCurrent);
  const elapsedSeconds = useGameStore((s) => s.elapsedSeconds);
  const selectedTool = useGameStore((s) => s.selectedTool);
  const selectedFixTool = useGameStore((s) => s.selectedFixTool);
  const accumulator = useGameStore((s) => s.accumulator);
  const currentRules = useGameStore((s) => s.currentRules);
  const phase = useGameStore((s) => s.phase);
  const inspectionOpen = useGameStore((s) => s.inspectionOpen);
  const toolPickupNotice = useGameStore((s) => s.toolPickupNotice);
  const result = useGameStore((s) => s.result);

  const root = { scale: `${CAM_UI_TABLET_SCALE} ${CAM_UI_TABLET_SCALE} ${CAM_UI_TABLET_SCALE}` as const };

  if (phase === "ended" && result) {
    const pass = result.passedSalaryGate && result.passedCompetencyGate;
    return h(
      "a-entity",
      { position: "-0.5 0.1 -0.62", rotation: "0 0 0", ...root },
      [
        statChip({
          key: "end1",
          label: "SHIFT",
          value: `Day ${currentDay} ended`,
          position: "-0.26 0.06 0"
        }),
        statChip({
          key: "end2",
          label: "GATES",
          value: pass ? "Passed" : "Remediation",
          position: "0 0.06 0",
          accent: pass ? "#55e8b2" : "#ff9aa4"
        }),
        statChip({
          key: "end3",
          label: "ACCURACY",
          value: `${result.competency}%`,
          position: "0.26 0.06 0"
        }),
        statChip({
          key: "end4",
          label: "SALARY",
          value: `$${result.salary}`,
          position: "-0.13 -0.02 0"
        }),
        h("a-text", {
          key: "hint",
          position: "0.13 -0.02 0",
          value: "Debrief board ahead",
          width: 1.1,
          align: "center",
          color: "#9eb7cc"
        })
      ]
    );
  }

  if (phase !== "running") return null;

  const shiftTime = `${Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, "0")}:${(elapsedSeconds % 60).toString().padStart(2, "0")}`;
  const competency =
    accumulator.processed === 0 ? 0 : Math.round((accumulator.correctDecisions / accumulator.processed) * 100);

  return h(
    "a-entity",
    { position: "-0.5 0.1 -0.62", rotation: "0 0 0", ...root },
    [
      statChip({ key: "d", label: "DAY", value: String(currentDay), position: "-0.28 0.08 0" }),
      statChip({ key: "w", label: "WAFER", value: wafer.id, position: "0 0.08 0" }),
      statChip({ key: "t", label: "TIME", value: shiftTime, position: "0.28 0.08 0" }),
      statChip({
        key: "a",
        label: "ACC",
        value: `${competency}% / ${currentRules.competencyTarget}%`,
        position: "-0.28 0 0",
        accent: competency >= currentRules.competencyTarget ? "#55e8b2" : "#dfefff"
      }),
      statChip({
        key: "s",
        label: "$",
        value: `${accumulator.salary} / ${currentRules.salaryTarget}`,
        position: "0 0 0"
      }),
      statChip({
        key: "i",
        label: "INSPECT",
        value: hasInspected ? "OK" : "Pending",
        position: "0.28 0 0",
        accent: hasInspected ? "#55e8b2" : "#ffd28a"
      }),
      statChip({
        key: "b",
        label: "BENCH",
        value: inspectionOpen ? "Open" : "—",
        position: "-0.28 -0.08 0",
        accent: inspectionOpen ? "#5ac8ff" : "#6a7a8a"
      }),
      statChip({
        key: "v",
        label: "VIEW",
        value: truncateForVrText(toolLabels[selectedTool], 16),
        position: "0 -0.08 0"
      }),
      statChip({
        key: "f",
        label: "FIX",
        value: truncateForVrText(fixToolLabels[selectedFixTool], 16),
        position: "0.28 -0.08 0"
      }),
      toolPickupNotice
        ? h("a-text", {
            key: "n",
            position: "0 -0.16 0",
            value: truncateForVrText(`Notice: ${toolPickupNotice}`, 64),
            width: 1.15,
            align: "center",
            color: "#ffd28a"
          })
        : null
    ]
  );
}
