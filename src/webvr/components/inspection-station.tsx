import type { WaferCase } from "@/game/types";
import { getWaferVisuals } from "@/webvr/components/wafer-entity";
import { createElement as h, useState } from "react";

export function InspectionStation({
  wafer,
  hasInspected,
  usedRework,
  onInspect,
  onAccept,
  onReject,
  onRework
}: {
  wafer: WaferCase;
  hasInspected: boolean;
  usedRework: boolean;
  onInspect: () => void;
  onAccept: () => void;
  onReject: () => void;
  onRework: () => void;
}) {
  const visuals = getWaferVisuals(wafer);
  const [hoverHint, setHoverHint] = useState<string | null>(null);

  return (
    <>
      {h("a-plane", {
        position: "0 0.01 -3",
        rotation: "-90 0 0",
        width: "10",
        height: "10",
        color: "#3f5a6d",
        src: "/assets/textures/floor-grit.svg",
        repeat: "7 7",
        roughness: "0.95",
        shadow: "receive: true"
      })}
      {h("a-plane", {
        position: "0 2.2 -6.6",
        width: "9",
        height: "2.9",
        color: "#2a4458",
        src: "/assets/textures/painted-console.svg",
        repeat: "2 1",
        roughness: "0.82"
      })}
      {h("a-plane", {
        position: "-4.35 1.6 -3.2",
        rotation: "0 40 0",
        width: "3.4",
        height: "3",
        color: "#274355",
        src: "/assets/textures/painted-console.svg",
        repeat: "1 1",
        roughness: "0.86"
      })}
      {h("a-plane", {
        position: "4.35 1.6 -3.2",
        rotation: "0 -40 0",
        width: "3.4",
        height: "3",
        color: "#274355",
        src: "/assets/textures/painted-console.svg",
        repeat: "1 1",
        roughness: "0.86"
      })}

      {h("a-box", { position: "-3.2 0.6 -4.7", width: "1.2", height: "1.1", depth: "1.2", color: "#2d4759" })}
      {h("a-box", { position: "3.2 0.6 -4.7", width: "1.2", height: "1.1", depth: "1.2", color: "#2d4759" })}
      {h("a-box", { position: "-2.35 0.95 -4.5", width: "0.28", height: "0.42", depth: "0.25", color: "#8ca7bc" })}
      {h("a-box", { position: "2.35 0.95 -4.5", width: "0.28", height: "0.42", depth: "0.25", color: "#8ca7bc" })}
      {h("a-box", {
        position: "-3.2 1.6 -4.8",
        width: "0.08",
        height: "1.4",
        depth: "0.08",
        color: "#7c99ae",
        animation: "property: rotation; from: 0 0 -18; to: 0 0 18; dir: alternate; dur: 2200; loop: true; easing: easeInOutSine"
      })}
      {h("a-box", {
        position: "-3.2 2.28 -4.8",
        width: "0.5",
        height: "0.08",
        depth: "0.08",
        color: "#a9c3d6",
        animation: "property: position; from: -3.35 2.28 -4.8; to: -3.05 2.28 -4.8; dir: alternate; dur: 1800; loop: true"
      })}

      {h("a-box", { position: "0 2.8 -3", depth: "0.2", width: "3.8", height: "0.08", color: "#3a586f" })}
      {h("a-box", { position: "0 2.65 -3", depth: "0.18", width: "3.3", height: "0.05", color: "#4a6e89" })}
      {h("a-cylinder", { position: "-0.95 2.65 -3", radius: "0.05", height: "0.06", color: "#4fe2ff", opacity: "0.85" })}
      {h("a-cylinder", {
        position: "0 2.65 -3",
        radius: "0.05",
        height: "0.06",
        color: "#8effc5",
        opacity: "0.85",
        animation: "property: opacity; from: 0.25; to: 0.95; dir: alternate; dur: 900; loop: true"
      })}
      {h("a-cylinder", {
        position: "0.95 2.65 -3",
        radius: "0.05",
        height: "0.06",
        color: "#ffd68c",
        opacity: "0.85",
        animation: "property: opacity; from: 0.95; to: 0.2; dir: alternate; dur: 1000; loop: true"
      })}

      {h("a-box", {
        position: "0 0.48 -3",
        depth: "2.8",
        width: "4.8",
        height: "0.82",
        color: "#405b70",
        src: "/assets/textures/painted-console.svg",
        repeat: "2.2 1.2",
        shadow: "cast: true; receive: true"
      })}
      {h("a-box", {
        position: "0 1.01 -2.95",
        depth: "1.8",
        width: "2.4",
        height: "0.06",
        color: "#57758f",
        src: "/assets/textures/brushed-metal.svg",
        repeat: "2 1"
      })}
      {h("a-box", { position: "-1.9 0.7 -2.2", depth: "0.45", width: "1.2", height: "1.1", color: "#2a4153" })}
      {h("a-box", { position: "1.9 0.7 -2.2", depth: "0.45", width: "1.2", height: "1.1", color: "#2a4153" })}

      {h("a-cylinder", {
        position: "0 1.025 -2.95",
        radius: "0.7",
        height: "0.11",
        color: "#5f7c93",
        metalness: "0.5",
        roughness: "0.4",
        shadow: "cast: true; receive: true"
      })}
      {h("a-cylinder", {
        position: "0 1.085 -2.95",
        radius: "0.665",
        height: "0.022",
        color: "#a9c6da",
        metalness: "0.58",
        roughness: "0.32",
        shadow: "cast: true; receive: true"
      })}
      {h("a-torus", {
        position: "0 1.085 -2.95",
        radius: "0.66",
        "radius-tubular": "0.01",
        rotation: "90 0 0",
        color: "#d4ecff",
        metalness: "0.62",
        roughness: "0.24",
        shadow: "cast: true"
      })}
      {h("a-cylinder", {
        position: "0 1.098 -2.95",
        radius: "0.65",
        height: "0.02",
        color: "#9ebcd2",
        metalness: "0.4",
        roughness: "0.5",
        "wafer-spin": "speed: 0.1",
        class: "clickable",
        "hover-glint": "",
        shadow: "cast: true; receive: true",
        onMouseEnter: () => setHoverHint("Inspect wafer surface"),
        onMouseLeave: () => setHoverHint(null),
        onClick: onInspect
      })}
      {h("a-circle", {
        position: "0 1.077 -2.95",
        rotation: "-90 0 0",
        radius: "0.62",
        src: "/assets/textures/wafer-grid.svg",
        opacity: "0.92",
        transparent: "true",
        class: "clickable",
        "hover-glint": "",
        shadow: "cast: true; receive: true",
        onMouseEnter: () => setHoverHint("Inspect wafer surface"),
        onMouseLeave: () => setHoverHint(null),
        onClick: onInspect
      })}
      {h("a-circle", { position: "0 1.079 -2.95", rotation: "-90 0 0", radius: "0.07", color: "#5b7388" })}
      {h("a-box", {
        position: visuals.markerPos,
        depth: "0.01",
        width: "0.028",
        height: "0.028",
        scale: visuals.markerScale,
        color: visuals.ringColor
      })}

      {h("a-box", { position: "-1.95 1.05 -2.07", depth: "0.2", width: "0.95", height: "0.42", color: "#2c4658" })}
      {h("a-box", { position: "1.95 1.05 -2.07", depth: "0.2", width: "0.95", height: "0.42", color: "#2c4658" })}
      {h("a-text", { position: "-2.2 1.1 -1.96", value: `Wafer: ${wafer.id}`, width: "1.1", color: "#d2f0ff" })}
      {h("a-text", { position: "-2.2 0.99 -1.96", value: hasInspected ? "Inspection complete" : "Inspect first", width: "1.1", color: "#e8f6ff" })}
      {h("a-text", {
        position: "1.7 1.1 -1.96",
        value: wafer.reworkEligible ? "Manual fix required" : "Direct disposition",
        width: "1.1",
        color: hasInspected ? "#ceffe7" : "#ffe2b8"
      })}
      {h("a-text", { position: "1.7 0.99 -1.96", value: "Hover controls for labels", width: "1.1", color: "#d2f0ff" })}

      {h("a-box", {
        position: "0 1.02 -1.48",
        depth: "0.42",
        width: "4.55",
        height: "0.3",
        color: "#2f4f63",
        src: "/assets/textures/painted-console.svg",
        repeat: "3.5 1",
        shadow: "cast: true; receive: true"
      })}
      {h("a-plane", {
        position: "0 1.18 -1.26",
        width: "4.1",
        height: "0.07",
        color: "#5f9ec8",
        src: "/assets/textures/warning-stripe.svg",
        transparent: "true"
      })}

      {h("a-box", {
        position: "0 1.07 -1.37",
        depth: "0.18",
        width: "1.2",
        height: "0.16",
        color: "#2c4a5f",
        src: "/assets/textures/brushed-metal.svg",
        repeat: "1 1"
      })}

      {h("a-cylinder", {
        position: "-1.75 1.15 -1.46",
        radius: "0.13",
        height: "0.09",
        color: "#3b8cff",
        material: "emissive: #1d4fd1; emissiveIntensity: 0.26",
        src: "/assets/textures/rubber-pad.svg",
        rotation: "90 0 0",
        class: "clickable pressable",
        "hover-glint": "",
        "animation__press": "property: position; to: -1.75 1.11 -1.46; dir: alternate; dur: 120; startEvents: click",
        onMouseEnter: () => setHoverHint("Open inspection workbench"),
        onMouseLeave: () => setHoverHint(null),
        onClick: onInspect
      })}
      {h("a-cylinder", {
        position: "-1.75 1.15 -1.46",
        radius: "0.2",
        height: "0.24",
        rotation: "90 0 0",
        class: "clickable",
        material: "opacity: 0.01; transparent: true; side: double",
        onClick: onInspect
      })}
      {h("a-text", { position: "-2.08 1.27 -1.16", value: "Inspect", width: "2.2", color: "#ecf9ff" })}

      {h("a-cylinder", {
        position: "-0.58 1.15 -1.46",
        radius: "0.13",
        height: "0.09",
        color: usedRework ? "#e2b632" : "#f1c948",
        material: "emissive: #8a670f; emissiveIntensity: 0.24",
        src: "/assets/textures/rubber-pad.svg",
        rotation: "90 0 0",
        class: "clickable pressable",
        "hover-glint": "",
        "animation__press": "property: position; to: -0.58 1.11 -1.46; dir: alternate; dur: 120; startEvents: click",
        onMouseEnter: () => setHoverHint("Apply manual fix with selected tool"),
        onMouseLeave: () => setHoverHint(null),
        onClick: onRework
      })}
      {h("a-cylinder", {
        position: "-0.58 1.15 -1.46",
        radius: "0.2",
        height: "0.24",
        rotation: "90 0 0",
        class: "clickable",
        material: "opacity: 0.01; transparent: true; side: double",
        onClick: onRework
      })}
      {h("a-text", {
        position: "-0.88 1.27 -1.16",
        value: usedRework ? "Fixed" : "Fix",
        width: "2.2",
        color: usedRework ? "#dbffe6" : "#caf5ff"
      })}

      {h("a-cylinder", {
        position: "0.58 1.15 -1.46",
        radius: "0.13",
        height: "0.09",
        color: "#31c766",
        material: "emissive: #1e6e3f; emissiveIntensity: 0.24",
        src: "/assets/textures/rubber-pad.svg",
        rotation: "90 0 0",
        class: "clickable pressable",
        "hover-glint": "",
        "animation__press": "property: position; to: 0.58 1.11 -1.46; dir: alternate; dur: 120; startEvents: click",
        onMouseEnter: () => setHoverHint("Accept wafer"),
        onMouseLeave: () => setHoverHint(null),
        onClick: onAccept
      })}
      {h("a-cylinder", {
        position: "0.58 1.15 -1.46",
        radius: "0.2",
        height: "0.24",
        rotation: "90 0 0",
        class: "clickable",
        material: "opacity: 0.01; transparent: true; side: double",
        onClick: onAccept
      })}
      {h("a-text", {
        position: "0.24 1.27 -1.16",
        value: "Accept",
        width: "2.2",
        color: "#effff6"
      })}

      {h("a-cylinder", {
        position: "1.75 1.15 -1.46",
        radius: "0.13",
        height: "0.09",
        color: "#dd4758",
        material: "emissive: #7e2334; emissiveIntensity: 0.24",
        src: "/assets/textures/rubber-pad.svg",
        rotation: "90 0 0",
        class: "clickable pressable",
        "hover-glint": "",
        "animation__press": "property: position; to: 1.75 1.11 -1.46; dir: alternate; dur: 120; startEvents: click",
        onMouseEnter: () => setHoverHint("Reject wafer"),
        onMouseLeave: () => setHoverHint(null),
        onClick: onReject
      })}
      {h("a-cylinder", {
        position: "1.75 1.15 -1.46",
        radius: "0.2",
        height: "0.24",
        rotation: "90 0 0",
        class: "clickable",
        material: "opacity: 0.01; transparent: true; side: double",
        onClick: onReject
      })}
      {h("a-text", {
        position: "1.42 1.27 -1.16",
        value: "Reject",
        width: "2.2",
        color: "#ffeef1"
      })}

      {hoverHint
        ? h("a-text", {
            position: "-0.72 1.18 -2.05",
            value: hoverHint,
            width: "2.4",
            color: "#e8f6ff",
            align: "left"
          })
        : null}
    </>
  );
}
