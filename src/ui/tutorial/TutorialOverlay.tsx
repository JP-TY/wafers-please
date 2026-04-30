"use client";

import { useEffect, useMemo, useState } from "react";
import { useGameStore } from "@/game/store/game-store";

type TutorialRequirement = "openInspection" | "selectTools" | "completeInspection" | "submitDisposition";

interface TutorialStep {
  title: string;
  description: string;
  requirement: TutorialRequirement | "none";
  tips: string[];
}

const steps: TutorialStep[] = [
  {
    title: "Welcome to Wafers, Please",
    description: "You are operating an in-line wafer review station. This tutorial gets you to first successful disposition.",
    requirement: "none",
    tips: ["Click the scene once to lock mouse", "Use mouse to look around", "Use WASD to reposition"]
  },
  {
    title: "Open Inspection Workbench",
    description: "Point reticle at wafer or Inspect button and click.",
    requirement: "openInspection",
    tips: ["Reticle target turns active on hover glint", "Inspection must be completed before accept/reject unlock"]
  },
  {
    title: "Pick View and Fix Tools",
    description: "Choose a viewing tool for detection and a separate fix tool for repair.",
    requirement: "selectTools",
    tips: ["Viewing tools isolate defect signal", "Fix tools are for repair workflow and quiz validation"]
  },
  {
    title: "Complete Inspection",
    description: "Reveal defect signal in the modal, then click Mark Inspection Complete.",
    requirement: "completeInspection",
    tips: ["Rotate, pan (Shift+drag), and zoom for visibility", "Use recommended tool from findings panel"]
  },
  {
    title: "Submit Disposition",
    description: "Use physical Accept or Reject button to finalize this wafer.",
    requirement: "submitDisposition",
    tips: ["Use Accept for minor controlled defects", "Use Reject for severe load or unstable signal"]
  }
];

export function TutorialOverlay() {
  const hasSeenTutorial = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("wafersPlease.tutorialSeen") === "1";
  })[0];
  const [isOpen, setIsOpen] = useState(() => !hasSeenTutorial);
  const [stepIndex, setStepIndex] = useState(0);

  const inspectionOpen = useGameStore((s) => s.inspectionOpen);
  const phase = useGameStore((s) => s.phase);
  const processed = useGameStore((s) => s.accumulator.processed);
  const milestones = useGameStore((s) => s.tutorialMilestones);
  const openInspection = useGameStore((s) => s.openInspection);
  const setSelectedTool = useGameStore((s) => s.setSelectedTool);
  const setSelectedFixTool = useGameStore((s) => s.setSelectedFixTool);
  const completeInspection = useGameStore((s) => s.completeInspection);
  const actOnWafer = useGameStore((s) => s.actOnWafer);
  const tutorialForcedOpen = !hasSeenTutorial && phase === "running" && processed === 0;

  const requirementMet = useMemo(() => {
    const req = steps[stepIndex]?.requirement ?? "none";
    if (req === "none") return true;
    if (req === "openInspection") return milestones.openedInspection || inspectionOpen;
    if (req === "selectTools") return milestones.selectedViewTool && milestones.selectedFixTool;
    if (req === "completeInspection") return milestones.completedInspection;
    if (req === "submitDisposition") return milestones.submittedDisposition;
    return false;
  }, [inspectionOpen, milestones, stepIndex]);

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
    }, 450);
    return () => window.clearTimeout(timer);
  }, [isOpen, requirementMet, stepIndex, tutorialForcedOpen]);

  if (!(isOpen || tutorialForcedOpen)) {
    return (
      <div className="tutorial-mini-guide" role="status" aria-live="polite">
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
    <div className="tutorial-shell" role="dialog" aria-modal="false" aria-labelledby="tutorial-title">
      <div className="tutorial-card tutorial-card-main">
        <div className="panel-head">
          <span className="panel-tag">Training Mission</span>
          <span className="panel-subtag">Step {stepIndex + 1}/{steps.length}</span>
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
        <div className="tutorial-actions">
          {stepIndex === 0 ? <button type="button" onClick={() => document.body.requestPointerLock?.()}>Capture Mouse</button> : null}
          {stepIndex === 1 ? <button type="button" onClick={openInspection}>Open Inspection</button> : null}
          {stepIndex === 2 ? (
            <>
              <button type="button" onClick={() => setSelectedTool("uv")}>Pick UV Viewing Tool</button>
              <button type="button" onClick={() => setSelectedFixTool("laser-trim")}>Pick Laser Fix Tool</button>
            </>
          ) : null}
          {stepIndex === 3 ? <button type="button" onClick={completeInspection}>Mark Complete</button> : null}
          {stepIndex === 4 ? <button type="button" onClick={() => actOnWafer("accept")}>Submit Accept</button> : null}
          <button type="button" onClick={() => setStepIndex(0)}>Replay</button>
        </div>
        <div className="tutorial-actions">
          {hasSeenTutorial ? (
            <button
              type="button"
              onClick={() => {
                window.localStorage.setItem("wafersPlease.tutorialSeen", "1");
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
                window.localStorage.setItem("wafersPlease.tutorialSeen", "1");
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
