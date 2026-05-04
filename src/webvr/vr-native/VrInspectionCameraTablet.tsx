"use client";

import { createElement as h, useEffect, useState } from "react";
import { useUiAudio } from "@/ui/audio/useUiAudio";
import {
  CAM_UI_FINDINGS_POSITION,
  CAM_UI_FINDINGS_ROTATION,
  CAM_UI_TABLET_POSITION,
  CAM_UI_TABLET_ROTATION,
  CAM_UI_TABLET_SCALE
} from "@/webvr/vr-native/vr-layout-constants";
import { vrCamTactileButton } from "@/webvr/vr-native/vr-cam-tactile-button";
import { truncateForVrText } from "@/webvr/vr-native/vr-text-utils";
import { useVrInspectionBenchShared } from "@/webvr/vr-native/use-vr-inspection-bench-shared";

/** Camera-mounted inspection controls + findings reader (high-frequency clicks). */
export function VrInspectionCameraTablet() {
  const { playCue } = useUiAudio();
  const b = useVrInspectionBenchShared();
  const [findingsPage, setFindingsPage] = useState(0);

  useEffect(() => {
    b.resetView();
    b.setFlowError(null);
    setFindingsPage(0);
  }, [b.wafer.id, b.resetView, b.setFlowError]);

  useEffect(() => {
    if (b.isOpen) {
      b.resetView();
      setFindingsPage(0);
    }
  }, [b.isOpen, b.resetView]);

  useEffect(() => {
    setFindingsPage((p) => Math.min(p, Math.max(0, b.findingsPages.length - 1)));
  }, [b.findingsPages.length]);

  if (!b.isOpen || b.fixPhase === "quiz") return null;

  const barW = Math.min(0.5, (b.inspectionConfidence / 100) * 0.5);

  const findingsBlock = h(
    "a-entity",
    { key: "findings", position: CAM_UI_FINDINGS_POSITION, rotation: CAM_UI_FINDINGS_ROTATION },
    [
      h("a-plane", {
        key: "fpbg",
        position: "0 0 -0.01",
        width: 0.58,
        height: 0.68,
        color: "#0a1218",
        opacity: 0.94,
        transparent: true,
        shader: "flat"
      }),
      h("a-text", {
        key: "fpt",
        position: "0 0.28 0",
        value: `Findings ${findingsPage + 1}/${b.findingsPages.length}`,
        width: 1.15,
        align: "center",
        color: "#8ec5e8"
      }),
      h("a-box", {
        key: "barbg",
        position: "0 0.16 0.01",
        width: 0.5,
        height: 0.026,
        depth: 0.01,
        color: "#1a2835"
      }),
      h("a-box", {
        key: "barfg",
        position: `${(-0.25 + barW / 2).toFixed(3)} 0.16 0.014`,
        width: barW,
        height: 0.02,
        depth: 0.012,
        color: b.inspectionConfidence >= b.requiredThreshold ? "#55e8b2" : "#5ac8ff"
      }),
      h("a-text", {
        key: "fpbody",
        position: "0 -0.04 0.01",
        value: truncateForVrText(b.findingsPages[findingsPage] ?? "", 480),
        width: 0.52,
        align: "center",
        color: "#dfefff"
      }),
      h("a-entity", { key: "fpnav", position: "0 -0.3 0.02" }, [
        vrCamTactileButton({
          key: "fpv",
          label: "Prev",
          position: "-0.18 0 0",
          width: 0.18,
          disabled: findingsPage === 0,
          playCue,
          onClick: () => setFindingsPage((p) => Math.max(0, p - 1))
        }),
        vrCamTactileButton({
          key: "fpn",
          label: "Next",
          position: "0.18 0 0",
          width: 0.18,
          disabled: findingsPage >= b.findingsPages.length - 1,
          playCue,
          onClick: () => setFindingsPage((p) => Math.min(b.findingsPages.length - 1, p + 1))
        })
      ])
    ]
  );

  const controls = h(
    "a-entity",
    { key: "ctrl", position: CAM_UI_TABLET_POSITION, rotation: CAM_UI_TABLET_ROTATION },
    [
      h("a-plane", {
        key: "bg",
        position: "0 0 -0.02",
        width: 0.92,
        height: 0.62,
        color: "#0e1a26",
        opacity: 0.96,
        transparent: true,
        shader: "flat"
      }),
      h("a-text", {
        key: "t",
        position: "0 0.26 0",
        value: "Microscope controls",
        width: 1.2,
        align: "center",
        color: "#9eb7cc"
      }),
      h("a-entity", { key: "viewtools", position: "-0.36 0.12 0.02" }, [
        h("a-text", { key: "vtt", position: "0 0.1 0", value: "View", width: 1, color: "#9eb7cc" }),
        ...b.viewTools.map((t, i) =>
          vrCamTactileButton({
            key: `vt-${t}`,
            label: b.toolLabels[t],
            position: `${(i % 3) * 0.24 - 0.24} ${-Math.floor(i / 3) * 0.1} 0`,
            width: 0.22,
            active: b.tool === t,
            disabled: b.fixPhase === "mini_game",
            playCue,
            onClick: () => b.setTool(t)
          })
        )
      ]),
      h("a-entity", { key: "fixtools", position: "0.36 0.12 0.02" }, [
        h("a-text", { key: "ftt", position: "0 0.1 0", value: "Fix", width: 1, color: "#9eb7cc" }),
        ...b.fixTools.map((t, i) =>
          vrCamTactileButton({
            key: `ft-${t}`,
            label: b.fixToolLabels[t],
            position: `${(i % 3) * 0.24 - 0.24} ${-Math.floor(i / 3) * 0.1} 0`,
            width: 0.22,
            active: b.selectedFixTool === t,
            disabled: b.fixPhase === "mini_game",
            playCue,
            onClick: () => b.setSelectedFixTool(t)
          })
        )
      ]),
      h("a-entity", { key: "nav", position: "0 -0.14 0.02" }, [
        vrCamTactileButton({
          key: "zm",
          label: "Zoom −",
          position: "-0.38 0 0",
          width: 0.17,
          playCue,
          onClick: () => b.setZoom((z) => Math.max(0.8, z - 0.12))
        }),
        vrCamTactileButton({
          key: "zp",
          label: "Zoom +",
          position: "-0.2 0 0",
          width: 0.17,
          playCue,
          onClick: () => b.setZoom((z) => Math.min(2.4, z + 0.12))
        }),
        vrCamTactileButton({
          key: "pan",
          label: b.panMode ? "Pan on" : "Pan off",
          position: "-0.02 0 0",
          width: 0.19,
          active: b.panMode,
          playCue,
          onClick: () => b.setPanMode((v) => !v)
        }),
        vrCamTactileButton({
          key: "rst",
          label: "Reset view",
          position: "0.18 0 0",
          width: 0.2,
          playCue,
          cue: "confirm",
          onClick: () => b.resetView()
        }),
        vrCamTactileButton({
          key: "rec",
          label: "Recenter",
          position: "0.38 0 0",
          width: 0.18,
          playCue,
          onClick: () => {
            b.setOffset({ x: 0, z: 0 });
            playCue("soft");
          }
        })
      ]),
      h("a-entity", { key: "rot", position: "0 -0.28 0.02" }, [
        vrCamTactileButton({
          key: "rl",
          label: "Rot L",
          position: "-0.34 0 0",
          width: 0.16,
          playCue,
          onClick: () => b.nudge(-14, 0, playCue)
        }),
        vrCamTactileButton({
          key: "rr",
          label: "Rot R",
          position: "-0.16 0 0",
          width: 0.16,
          playCue,
          onClick: () => b.nudge(14, 0, playCue)
        }),
        vrCamTactileButton({
          key: "tu",
          label: "Tilt up",
          position: "0.02 0 0",
          width: 0.16,
          playCue,
          onClick: () => b.nudge(0, -10, playCue)
        }),
        vrCamTactileButton({
          key: "td",
          label: "Tilt dn",
          position: "0.2 0 0",
          width: 0.16,
          playCue,
          onClick: () => b.nudge(0, 10, playCue)
        })
      ]),
      h("a-entity", { key: "footer", position: "0 -0.42 0.02" }, [
        vrCamTactileButton({
          key: "fix",
          label: "Apply manual fix",
          position: "-0.34 0 0",
          width: 0.3,
          disabled: !b.wafer.reworkEligible || b.fixPhase === "mini_game",
          playCue,
          cue: "soft",
          onClick: () => {
            if (b.fixPhase === "mini_game") {
              playCue("warn");
              b.setFlowError("Complete active tool simulation before starting another fix flow.");
              return;
            }
            b.setFlowError(null);
            b.startFixQuiz();
          }
        }),
        vrCamTactileButton({
          key: "done",
          label: "Mark complete",
          position: "0.02 0 0",
          width: 0.3,
          disabled: !b.canMarkComplete,
          playCue,
          cue: "confirm",
          onClick: () => b.complete()
        }),
        vrCamTactileButton({
          key: "x",
          label: "Close",
          position: "0.36 0 0",
          width: 0.22,
          playCue,
          cue: "soft",
          onClick: () => {
            if (b.fixPhase === "quiz") b.cancelFixQuiz();
            b.setFlowError(null);
            b.close();
            playCue("soft");
          }
        })
      ])
    ]
  );

  return h(
    "a-entity",
    {
      key: "insp-cam-tablet",
      scale: `${CAM_UI_TABLET_SCALE} ${CAM_UI_TABLET_SCALE} ${CAM_UI_TABLET_SCALE}`
    },
    [findingsBlock, controls]
  );
}
