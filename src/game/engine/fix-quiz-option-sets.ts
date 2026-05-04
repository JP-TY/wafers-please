import { fixToolLabels, type FixTool } from "@/game/inspection-tools";
import type { WaferCase } from "@/game/types";
import { seeded, shuffleDeterministic } from "@/game/engine/quiz-random";

export type FixQuizOption = {
  id: string;
  label: string;
  rationale: string;
  isCorrect: boolean;
};

export type FixQuizAnswers = {
  tool: FixTool | null;
  mechanism: string | null;
  sequence: string | null;
  release: string | null;
};

export type CaseContext = {
  defectKinds: number;
  hasConnectivityRisk: boolean;
  severeCount: number;
};

export function buildMechanismOptions(
  wafer: WaferCase,
  caseContext: CaseContext,
  fixQuizAttemptsCurrent: number
): FixQuizOption[] {
  const severeDefectPresent = caseContext.severeCount > 0;
  const hasConnectivityRisk = caseContext.hasConnectivityRisk;
  const correctLabel = hasConnectivityRisk
    ? "Prioritize mechanism containment because unresolved connectivity signatures can cause latent downstream electrical fallout."
    : severeDefectPresent
      ? "Prioritize mechanism containment because unresolved high-severity signatures can collapse process margin and yield."
      : "Prioritize mechanism containment because unresolved local signatures can propagate into downstream yield loss.";
  const optionPool: FixQuizOption[] = [
    {
      id: "yield-and-reliability",
      label: correctLabel,
      rationale: "Mechanism-first control preserves yield and reliability.",
      isCorrect: true
    },
    {
      id: "throughput-dominates",
      label: "Prioritize throughput over mechanism control when defect behavior appears operationally stable during inspection.",
      rationale: "Near-miss: sounds practical but underweights latent risk.",
      isCorrect: false
    },
    {
      id: "single-view-confidence",
      label: "Prioritize confidence in the strongest single view because secondary modes rarely change practical risk classification.",
      rationale: "Near-miss: ignores cross-mode verification requirement.",
      isCorrect: false
    },
    {
      id: "downstream-screening",
      label: "Prioritize downstream screening because front-end intervention has limited effect once signatures are clearly localized.",
      rationale: "Near-miss: delays control too late in flow.",
      isCorrect: false
    }
  ];
  return shuffleDeterministic(optionPool, `${wafer.id}-mechanism-f-${fixQuizAttemptsCurrent}`);
}

export function buildSequenceOptions(
  wafer: WaferCase,
  requiredFixTool: FixTool,
  fixQuizAttemptsCurrent: number
): FixQuizOption[] {
  const sequenceFrames = [
    `Verify in multiple views, align wafer, apply ${fixToolLabels[requiredFixTool]}, then re-verify stability before release.`,
    `Cross-check signal first, execute ${fixToolLabels[requiredFixTool]} intervention, then confirm post-fix residual risk.`,
    `Validate signature, perform controlled ${fixToolLabels[requiredFixTool]} action, and complete post-repair verification before disposition.`
  ];
  const optionPool: FixQuizOption[] = [
    {
      id: "verify-align-repair-reinspect",
      label: sequenceFrames[Math.floor(seeded(`${wafer.id}-seq-frame`) * sequenceFrames.length)] as string,
      rationale: "Correct sequence maintains process control.",
      isCorrect: true
    },
    {
      id: "repair-then-verify",
      label: "Align and repair quickly first, then run a verification pass only if residual signatures are still obvious.",
      rationale: "Near-miss: defers pre-fix verification.",
      isCorrect: false
    },
    {
      id: "single-mode-cycle",
      label: "Use one stable view mode for pre/post checks to reduce interpretation drift between observation steps.",
      rationale: "Near-miss: misses multi-view validation.",
      isCorrect: false
    },
    {
      id: "triage-then-queue",
      label: "Perform light triage, queue repair as needed, and make disposition once throughput impact is acceptable.",
      rationale: "Near-miss: weak control closure before decision.",
      isCorrect: false
    }
  ];
  return shuffleDeterministic(optionPool, `${wafer.id}-sequence-f-${fixQuizAttemptsCurrent}`);
}

export function buildReleaseOptions(
  wafer: WaferCase,
  caseContext: CaseContext,
  fixQuizAttemptsCurrent: number
): FixQuizOption[] {
  const hasKiller = caseContext.severeCount > 0 || caseContext.hasConnectivityRisk;
  const optionPool: FixQuizOption[] = [
    {
      id: hasKiller ? "reject-after-fix-check" : "accept-after-fix-check",
      label: hasKiller
        ? "Reject if high-risk signatures remain unstable after repair verification across inspection views."
        : "Accept only when post-repair verification remains stable across inspection views and risk is resolved.",
      rationale: "Disposition must follow post-fix stability, not optimism.",
      isCorrect: true
    },
    {
      id: "accept-after-execution",
      label: "Accept after successful repair execution when no immediate anomaly escalation appears during the same pass.",
      rationale: "Near-miss: execution alone is insufficient.",
      isCorrect: false
    },
    {
      id: "confidence-only-release",
      label: "Release based on confidence threshold once cleared, since score integration captures the remaining uncertainty.",
      rationale: "Near-miss: confidence is support signal, not sole rule.",
      isCorrect: false
    },
    {
      id: "conservative-default-reject",
      label: "Reject by default after any manual intervention to avoid compounding process uncertainty at release.",
      rationale: "Near-miss: over-conservative and ignores successful verification.",
      isCorrect: false
    }
  ];
  return shuffleDeterministic(optionPool, `${wafer.id}-release-f-${fixQuizAttemptsCurrent}`);
}

export function buildFixToolShuffle(wafer: WaferCase, fixQuizAttemptsCurrent: number): FixTool[] {
  return shuffleDeterministic(Object.keys(fixToolLabels) as FixTool[], `${wafer.id}-fixtool-${fixQuizAttemptsCurrent}`);
}

export function evaluateFixQuizSubmission(args: {
  quizAnswers: FixQuizAnswers;
  mechanismOptions: FixQuizOption[];
  sequenceOptions: FixQuizOption[];
  releaseOptions: FixQuizOption[];
  requiredFixTool: FixTool;
}): { isCorrect: boolean; score: number; misses: string[] } {
  const { quizAnswers, mechanismOptions, sequenceOptions, releaseOptions, requiredFixTool } = args;
  const mechanismChoice = mechanismOptions.find((option) => option.id === quizAnswers.mechanism);
  const sequenceChoice = sequenceOptions.find((option) => option.id === quizAnswers.sequence);
  const releaseChoice = releaseOptions.find((option) => option.id === quizAnswers.release);
  const isToolCorrect = quizAnswers.tool === requiredFixTool;
  const isMechanismCorrect = Boolean(mechanismChoice?.isCorrect);
  const isSequenceCorrect = Boolean(sequenceChoice?.isCorrect);
  const isReleaseCorrect = Boolean(releaseChoice?.isCorrect);
  const score =
    Number(isToolCorrect) + Number(isMechanismCorrect) + Number(isSequenceCorrect) + Number(isReleaseCorrect);
  const passedCritical = isToolCorrect && isReleaseCorrect;
  const isCorrect = score >= 3 && passedCritical;
  const misses: string[] = [];
  if (!isCorrect) {
    if (!isToolCorrect) misses.push("Tool competency miss: choose the repair tool that matches dominant mechanism.");
    if (!isMechanismCorrect) misses.push("Risk competency miss: prioritize yield/reliability over throughput shortcuts.");
    if (!isSequenceCorrect) misses.push("Sequence competency miss: keep verify-before and verify-after repair.");
    if (!isReleaseCorrect) misses.push("Release competency miss: disposition must follow post-fix stability.");
  }
  return { isCorrect, score, misses };
}
