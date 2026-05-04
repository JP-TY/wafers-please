"use client";

import { useEffect, useMemo, useState } from "react";
import {
  isTutorialRequirementMet,
  stepsDesktop,
  stepsVr,
  TUTORIAL_AUTO_ADVANCE_MS,
  TUTORIAL_SEEN_KEY,
  type TutorialStep
} from "@/game/tutorial-steps";
import { useGameStore } from "@/game/store/game-store";

export function TutorialOverlay() {
  const hasSeenTutorial = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(TUTORIAL_SEEN_KEY) === "1";
  })[0];
  const [isOpen, setIsOpen] = useState(() => !hasSeenTutorial);
  const [stepIndex, setStepIndex] = useState(0);

  const playModePreference = useGameStore((s) => s.playModePreference);
  const isVrUi = playModePreference === "vr";
  const steps = useMemo<TutorialStep[]>(() => (isVrUi ? stepsVr : stepsDesktop), [isVrUi]);

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
  const tutorialForcedOpen =
    sessionPhase === "playing" && !hasSeenTutorial && phase === "running" && processed === 0;

  const requirementMet = useMemo(
    () => isTutorialRequirementMet(stepIndex, steps, milestones, inspectionOpen),
    [inspectionOpen, milestones, stepIndex, steps]
  );

  const currentStep = steps[stepIndex] ?? steps[0];
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);
  const completedCount = [
    milestones.openedInspection || inspectionOpen,
    milestones.selectedViewTool && milestones.selectedFixTool,
    milestones.completedInspection,
    milestones.submittedDisposition
  ].filter(Boolean).length;

  useEffect(() => {
    if (!(isOpen || tutorialForcedOpen) || !requirementMet) return;
    if (stepIndex >= steps.length - 1) return;
    const timer = window.setTimeout(() => {
      setStepIndex((idx) => Math.min(steps.length - 1, idx + 1));
    }, TUTORIAL_AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen, requirementMet, stepIndex, tutorialForcedOpen, steps.length]);

  if (!(isOpen || tutorialForcedOpen)) {
    return (
      <div className={`tutorial-mini-guide${isVrUi ? " tutorial-mini-guide--xr" : ""}`} role="status" aria-live="polite">
        <span className="panel-tag">Current Step</span>
        <span>
          {steps[stepIndex]?.title ??
            (inspectionOpen
              ? "Complete inspection in workbench"
              : !milestones.completedInspection
                ? "Inspect current wafer"
                : !milestones.submittedDisposition
                  ? "Submit first disposition"
                  : "Continue processing wafers")}
        </span>
        {hasSeenTutorial ? (
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
            }}
          >
            Open Tutorial
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`tutorial-shell${isVrUi ? " tutorial-shell--xr" : ""}`} role="dialog" aria-modal="false" aria-labelledby="tutorial-title">
      <div className={`tutorial-card tutorial-card-main${isVrUi ? " tutorial-card--xr" : ""}`}>
        <div className="panel-head">
          <span className="panel-tag">Training Mission</span>
          <span className="panel-subtag">
            Step {stepIndex + 1}/{steps.length}
          </span>
          <span className={completedCount >= 3 ? "status-chip status-ok" : "status-chip"}>Checklist {completedCount}/4</span>
        </div>
        <div className="tutorial-progress">
          <div className="tutorial-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <h3 id="tutorial-title">{currentStep.title}</h3>
        <p>{currentStep.description}</p>
        <ul className="tutorial-tips">
          {currentStep.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
        <div className={`tutorial-actions${isVrUi ? " tutorial-actions--xr" : ""}`}>
          {stepIndex === 0 && !isVrUi ? (
            <button type="button" onClick={() => document.body.requestPointerLock?.()}>
              Capture Mouse
            </button>
          ) : null}
          {stepIndex === 1 ? <button type="button" onClick={openInspection}>Open Inspection</button> : null}
          {stepIndex === 2 ? (
            <>
              <button type="button" onClick={() => setSelectedTool("uv")}>
                Pick UV Viewing Tool
              </button>
              <button type="button" onClick={() => setSelectedFixTool("laser-trim")}>
                Pick Laser Fix Tool
              </button>
            </>
          ) : null}
          {stepIndex === 3 ? <button type="button" onClick={completeInspection}>Mark Complete</button> : null}
          {stepIndex === 4 ? (
            <button type="button" onClick={() => actOnWafer("accept")}>
              Submit Accept
            </button>
          ) : null}
          <button type="button" onClick={() => setStepIndex(0)}>
            Replay
          </button>
        </div>
        <div className={`tutorial-actions${isVrUi ? " tutorial-actions--xr" : ""}`}>
          {hasSeenTutorial ? (
            <button
              type="button"
              onClick={() => {
                window.localStorage.setItem(TUTORIAL_SEEN_KEY, "1");
                setIsOpen(false);
              }}
            >
              Skip
            </button>
          ) : null}
          <button type="button" onClick={() => setStepIndex((idx) => Math.max(0, idx - 1))} disabled={stepIndex === 0}>
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              if (stepIndex === steps.length - 1) {
                window.localStorage.setItem(TUTORIAL_SEEN_KEY, "1");
                setIsOpen(false);
                return;
              }
              setStepIndex((idx) => Math.min(steps.length - 1, idx + 1));
            }}
            disabled={!requirementMet}
          >
            {stepIndex === steps.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
