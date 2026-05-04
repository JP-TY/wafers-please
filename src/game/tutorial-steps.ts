export type TutorialRequirement = "openInspection" | "selectTools" | "completeInspection" | "submitDisposition" | "none";

export interface TutorialStep {
  title: string;
  description: string;
  requirement: TutorialRequirement | "none";
  tips: string[];
}

export const TUTORIAL_SEEN_KEY = "wafersPlease.tutorialSeen";
export const TUTORIAL_AUTO_ADVANCE_MS = 450;

export const stepsDesktop: TutorialStep[] = [
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

export const stepsVr: TutorialStep[] = [
  {
    title: "Welcome (WebXR)",
    description: "Same training flow as desktop, with larger panels and laser-friendly controls.",
    requirement: "none",
    tips: [
      "Thumbsticks move you along the floor; turn your head to look",
      "Aim either controller laser at buttons, press trigger to click",
      "HUD, tutorial, and microscope controls sit on your headset view; the wafer preview stays on the station easel"
    ]
  },
  {
    title: "Open Inspection Workbench",
    description: "Aim laser at Inspect on the console or the wafer, then trigger.",
    requirement: "openInspection",
    tips: ["You must open inspection before Accept/Reject unlock", "If the laser misses, move closer or re-aim"]
  },
  {
    title: "Pick View and Fix Tools",
    description: "In the microscope panel, tap the large tool tiles (not tiny dropdowns).",
    requirement: "selectTools",
    tips: ["Pick UV view and a fix tool that matches training", "Tiles are sized for laser selection"]
  },
  {
    title: "Complete Inspection",
    description: "Use Zoom, Rotate, Pan on the board, then Mark complete.",
    requirement: "completeInspection",
    tips: ["Raise confidence above the threshold", "Toggle Pan to slide the wafer view"]
  },
  {
    title: "Submit Disposition",
    description: "Return to the station and laser-click Accept or Reject.",
    requirement: "submitDisposition",
    tips: ["Close the microscope when done", "Accept only when training rules allow"]
  }
];

export function isTutorialRequirementMet(
  stepIndex: number,
  steps: TutorialStep[],
  milestones: {
    openedInspection: boolean;
    selectedViewTool: boolean;
    selectedFixTool: boolean;
    completedInspection: boolean;
    submittedDisposition: boolean;
  },
  inspectionOpen: boolean
): boolean {
  const req = steps[stepIndex]?.requirement ?? "none";
  if (req === "none") return true;
  if (req === "openInspection") return milestones.openedInspection || inspectionOpen;
  if (req === "selectTools") return milestones.selectedViewTool && milestones.selectedFixTool;
  if (req === "completeInspection") return milestones.completedInspection;
  if (req === "submitDisposition") return milestones.submittedDisposition;
  return false;
}
