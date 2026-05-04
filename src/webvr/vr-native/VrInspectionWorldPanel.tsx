"use client";

import { createElement as h, useEffect } from "react";
import { WORLD_WAFER_PANEL_POSITION, WORLD_WAFER_PANEL_ROTATION } from "@/webvr/vr-native/vr-layout-constants";
import { markerColor, useVrInspectionBenchShared } from "@/webvr/vr-native/use-vr-inspection-bench-shared";
import { truncateForVrText } from "@/webvr/vr-native/vr-text-utils";

/** World-mounted wafer preview and slim read-only status (controls live on camera). */
export function VrInspectionWorldPanel() {
  const b = useVrInspectionBenchShared();

  useEffect(() => {
    b.resetView();
    b.setFlowError(null);
  }, [b.wafer.id, b.resetView, b.setFlowError]);

  useEffect(() => {
    if (b.isOpen) b.resetView();
  }, [b.isOpen, b.resetView]);

  if (!b.isOpen) return null;

  const barW = Math.min(0.42, (b.inspectionConfidence / 100) * 0.42);

  const waferRoot = h(
    "a-entity",
    {
      position: `${b.offset.x.toFixed(3)} 0.22 ${b.offset.z.toFixed(3)}`,
      rotation: `${b.rotation.x} ${b.rotation.y} 0`,
      scale: `${b.zoom} ${b.zoom} ${b.zoom}`
    },
    [
      h("a-cylinder", {
        key: "disc",
        position: "0 0 0",
        radius: 0.2,
        height: 0.018,
        color: "#7a9ab4",
        metalness: 0.45,
        roughness: 0.35
      }),
      ...b.visibleMarkers.map((m, i) =>
        h("a-box", {
          key: `m-${i}`,
          position: `${((m.x / 100 - 0.5) * 0.34).toFixed(3)} 0.02 ${(-(m.y / 100 - 0.5) * 0.34).toFixed(3)}`,
          width: Math.max(0.012, m.size / 900),
          height: 0.012,
          depth: m.defectClass === "scratch" ? 0.04 : 0.018,
          rotation: `0 ${m.rot} 0`,
          color: markerColor[m.defectClass] ?? "#fff",
          opacity: 0.88,
          transparent: true
        })
      )
    ]
  );

  return h(
    "a-entity",
    {
      position: WORLD_WAFER_PANEL_POSITION,
      rotation: WORLD_WAFER_PANEL_ROTATION
    },
    [
      h("a-plane", {
        key: "bg",
        position: "0 0 -0.02",
        width: 1.15,
        height: 0.88,
        color: "#0e1a26",
        opacity: 0.96,
        transparent: true,
        shader: "flat"
      }),
      h("a-text", {
        key: "title",
        position: "0 0.38 0",
        value: truncateForVrText(`${b.wafer.id} | ${b.inspectionConfidence}% / ${b.requiredThreshold}%`, 72),
        width: 1.35,
        align: "center",
        color: "#dff6ff"
      }),
      h("a-text", {
        key: "risk",
        position: "0 0.28 0",
        value: truncateForVrText(
          `Risk ${b.dispositionGuidance.riskBand} | ${b.wafer.reworkEligible ? "Rework ok" : "No rework"}`,
          80
        ),
        width: 1.25,
        align: "center",
        color: "#b8d9f0"
      }),
      h("a-text", {
        key: "pend",
        position: "0 0.18 0",
        value: truncateForVrText(
          b.pendingFixTools.length > 0
            ? `Fix tools: ${b.pendingFixTools.map((t) => b.fixToolLabels[t]).join(", ")}`
            : "All required fix tools cleared",
          90
        ),
        width: 1.15,
        align: "center",
        color: "#cfe8ff"
      }),
      b.fixStatusLine || b.flowError
        ? h("a-text", {
            key: "stat",
            position: "0 0.08 0",
            value: truncateForVrText([b.fixStatusLine, b.flowError].filter(Boolean).join(" | "), 96),
            width: 1.2,
            align: "center",
            color: "#ffd28a"
          })
        : null,
      h("a-box", {
        key: "barbg",
        position: "0 -0.02 0.01",
        width: 0.44,
        height: 0.024,
        depth: 0.008,
        color: "#1a2835"
      }),
      h("a-box", {
        key: "barfg",
        position: `${(-0.22 + barW / 2).toFixed(3)} -0.02 0.014`,
        width: barW,
        height: 0.018,
        depth: 0.01,
        color: b.inspectionConfidence >= b.requiredThreshold ? "#55e8b2" : "#5ac8ff"
      }),
      waferRoot,
      h("a-text", {
        key: "ev",
        position: "0 -0.36 0.02",
        value: b.evidenceLine,
        width: 1.05,
        align: "center",
        color: b.canRevealDefect ? "#8effc5" : "#ffd28a"
      })
    ]
  );
}
