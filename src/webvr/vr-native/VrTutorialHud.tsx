"use client";

import { createElement as h, useEffect, useMemo, useState } from "react";
import {
  isTutorialRequirementMet,
  stepsVr,
  TUTORIAL_AUTO_ADVANCE_MS,
  TUTORIAL_SEEN_KEY,
  type TutorialStep
} from "@/game/tutorial-steps";
import { useGameStore } from "@/game/store/game-store";
import { useUiAudio } from "@/ui/audio/useUiAudio";
import { CAM_UI_TABLET_SCALE } from "@/webvr/vr-native/vr-layout-constants";
import { vrCamTactileButton } from "@/webvr/vr-native/vr-cam-tactile-button";
import { truncateForVrText } from "@/webvr/vr-native/vr-text-utils";

/** Camera-mounted tutorial (mini strip + full wizard); replaces distant world board in VR. */
export function VrTutorialHud() {
  const { playCue } = useUiAudio();
  const hasSeenTutorial = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(TUTORIAL_SEEN_KEY) === "1";
  })[0];
  const [isOpen, setIsOpen] = useState(() => !hasSeenTutorial);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = useMemo<TutorialStep[]>(() => stepsVr, []);

  const sessionPhase = useGameStore((s) => s.sessionPhase);
  const inspectionOpen = useGameStore((s) => s.inspectionOpen);
  const phase = useGameStore((s) => s.phase);
  const processed = useGameStore((s) => s.accumulator.processed);
  const milestones = useGameStore((s) => s.tutorialMilestones);
  const openInspection = useGameStore((s) => s.openInspection);
  const setSelectedTool = useGameStore((s) => s.setSelectedTool);
  const setSelectedFixTool = useGameStore((s) => s.setSelectedFixTool);
  const completeInspection = useGameStore((s) => s.completeInspection);
  const actOnWafer = useGameStore((s) => s.actOnWafer);
  const result = useGameStore((s) => s.result);

  const tutorialForcedOpen =
    sessionPhase === "playing" && !hasSeenTutorial && phase === "running" && processed === 0;

  const requirementMet = useMemo(
    () => isTutorialRequirementMet(stepIndex, steps, milestones, inspectionOpen),
    [inspectionOpen, milestones, stepIndex, steps]
  );

  useEffect(() => {
    if (!(isOpen || tutorialForcedOpen) || !requirementMet) return;
    if (stepIndex >= steps.length - 1) return;
    const timer = window.setTimeout(() => {
      setStepIndex((idx) => Math.min(steps.length - 1, idx + 1));
    }, TUTORIAL_AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen, requirementMet, stepIndex, tutorialForcedOpen, steps.length]);

  if (sessionPhase !== "playing" || result) return null;

  const miniTitle =
    steps[stepIndex]?.title ??
    (inspectionOpen
      ? "Complete inspection in workbench"
      : !milestones.completedInspection
        ? "Inspect current wafer"
        : !milestones.submittedDisposition
          ? "Submit first disposition"
          : "Continue processing wafers");

  const scale = `${CAM_UI_TABLET_SCALE} ${CAM_UI_TABLET_SCALE} ${CAM_UI_TABLET_SCALE}`;

  if (!(isOpen || tutorialForcedOpen)) {
    return h(
      "a-entity",
      { position: "-0.42 0.2 -0.58", rotation: "0 0 0", scale },
      [
        h("a-plane", {
          key: "mbg",
          position: "0 0 -0.01",
          width: 0.62,
          height: 0.14,
          color: "#0c1824",
          opacity: 0.94,
          transparent: true,
          shader: "flat"
        }),
        h("a-text", {
          key: "mt",
          position: "0 0.03 0",
          value: truncateForVrText(`Training: ${miniTitle}`, 72),
          width: 0.95,
          align: "center",
          color: "#dff6ff"
        }),
        hasSeenTutorial
          ? vrCamTactileButton({
              key: "op",
              label: "Open tutorial",
              position: "0 -0.04 0.02",
              width: 0.36,
              playCue,
              onClick: () => setIsOpen(true)
            })
          : null
      ]
    );
  }

  const current = steps[stepIndex] ?? steps[0];
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);
  const completedCount = [
    milestones.openedInspection || inspectionOpen,
    milestones.selectedViewTool && milestones.selectedFixTool,
    milestones.completedInspection,
    milestones.submittedDisposition
  ].filter(Boolean).length;

  return h(
    "a-entity",
    { position: "0.02 0.06 -0.6", rotation: "0 -12 0", scale },
    [
      h("a-plane", {
        key: "bg",
        position: "0 0 -0.02",
        width: 0.88,
        height: 0.72,
        color: "#0c1824",
        opacity: 0.95,
        transparent: true,
        shader: "flat"
      }),
      h("a-text", {
        key: "meta",
        position: "0 0.3 0",
        value: `Training ${stepIndex + 1}/${steps.length} | Checklist ${completedCount}/4 | ${progress}%`,
        width: 1.15,
        align: "center",
        color: "#9fe8ff"
      }),
      h("a-text", {
        key: "h",
        position: "0 0.2 0",
        value: current.title,
        width: 1.1,
        align: "center",
        color: "#dff6ff"
      }),
      h("a-text", {
        key: "d",
        position: "0 0.1 0",
        value: truncateForVrText(current.description, 140),
        width: 0.95,
        align: "center",
        color: "#c6def1"
      }),
      h("a-text", {
        key: "t",
        position: "0 0 0",
        value: truncateForVrText(current.tips.join(" | "), 160),
        width: 0.88,
        align: "center",
        color: "#9eb7cc"
      }),
      h("a-entity", { key: "step-actions", position: "0 -0.12 0.02" }, [
        stepIndex === 1
          ? vrCamTactileButton({
              key: "oi",
              label: "Open bench",
              position: "0 0 0",
              width: 0.34,
              playCue,
              onClick: () => openInspection()
            })
          : null,
        stepIndex === 2
          ? h("a-entity", { key: "st", position: "0 0 0" }, [
              vrCamTactileButton({
                key: "uv",
                label: "UV view",
                position: "-0.2 0 0",
                width: 0.26,
                playCue,
                onClick: () => setSelectedTool("uv")
              }),
              vrCamTactileButton({
                key: "fx",
                label: "Laser fix",
                position: "0.2 0 0",
                width: 0.26,
                playCue,
                onClick: () => setSelectedFixTool("laser-trim")
              })
            ])
          : null,
        stepIndex === 3
          ? vrCamTactileButton({
              key: "mc",
              label: "Mark complete",
              position: "0 0 0",
              width: 0.36,
              playCue,
              onClick: () => completeInspection()
            })
          : null,
        stepIndex === 4
          ? vrCamTactileButton({
              key: "ac",
              label: "Accept",
              position: "0 0 0",
              width: 0.32,
              playCue,
              onClick: () => actOnWafer("accept")
            })
          : null
      ]),
      h("a-entity", { key: "nav", position: "0 -0.28 0.02" }, [
        vrCamTactileButton({
          key: "bk",
          label: "Back",
          position: "-0.32 0 0",
          width: 0.18,
          disabled: stepIndex === 0,
          playCue,
          onClick: () => setStepIndex((i) => Math.max(0, i - 1))
        }),
        vrCamTactileButton({
          key: "skip",
          label: "Skip",
          position: "0 0 0",
          width: 0.2,
          playCue,
          onClick: () => {
            window.localStorage.setItem(TUTORIAL_SEEN_KEY, "1");
            setIsOpen(false);
          }
        }),
        vrCamTactileButton({
          key: "nx",
          label: stepIndex === steps.length - 1 ? "Done" : "Next",
          position: "0.32 0 0",
          width: 0.2,
          disabled: !requirementMet,
          playCue,
          onClick: () => {
            if (!requirementMet) return;
            if (stepIndex === steps.length - 1) {
              window.localStorage.setItem(TUTORIAL_SEEN_KEY, "1");
              setIsOpen(false);
              return;
            }
            setStepIndex((i) => Math.min(steps.length - 1, i + 1));
          }
        })
      ]),
      vrCamTactileButton({
        key: "replay",
        label: "Replay",
        position: "0 -0.38 0.02",
        width: 0.22,
        playCue,
        onClick: () => setStepIndex(0)
      })
    ]
  );
}
