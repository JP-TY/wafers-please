"use client";

import { useCallback, useMemo } from "react";
import { defectCatalog } from "@/game/config/defects";
import { getDispositionGuidance } from "@/game/engine/decision-thresholds";
import { buildInspectionFindingsPages } from "@/game/engine/inspection-copy";
import {
  buildFixToolShuffle,
  buildMechanismOptions,
  buildReleaseOptions,
  buildSequenceOptions
} from "@/game/engine/fix-quiz-option-sets";
import { buildDefectMarkers } from "@/game/engine/inspection-defect-markers";
import { computeInspectionConfidence } from "@/game/engine/inspection-confidence";
import {
  fixToolByDefect,
  fixToolLabels,
  optimalToolByDefect,
  toolLabels,
  type FixTool,
  type InspectionTool
} from "@/game/inspection-tools";
import { useGameStore } from "@/game/store/game-store";
import { useInspectionViewVrStore } from "@/webvr/vr-native/inspection-view-vr-store";

const markerColor: Record<string, string> = {
  particle: "#c9e8ff",
  scratch: "#ffb8c3",
  bridge: "#ff9a6b",
  open: "#ffd28a",
  misalignment: "#b8ffd0",
  benign: "#d0ddff"
};

export { markerColor };

export function useVrInspectionBenchShared() {
  const isOpen = useGameStore((s) => s.inspectionOpen);
  const close = useGameStore((s) => s.closeInspection);
  const complete = useGameStore((s) => s.completeInspection);
  const currentDay = useGameStore((s) => s.currentDay);
  const wafer = useGameStore((s) => s.currentWafer);
  const tool = useGameStore((s) => s.selectedTool);
  const setTool = useGameStore((s) => s.setSelectedTool);
  const selectedFixTool = useGameStore((s) => s.selectedFixTool);
  const setSelectedFixTool = useGameStore((s) => s.setSelectedFixTool);
  const startFixQuiz = useGameStore((s) => s.startFixQuiz);
  const cancelFixQuiz = useGameStore((s) => s.cancelFixQuiz);
  const submitFixQuizAttempt = useGameStore((s) => s.submitFixQuizAttempt);
  const startFixMiniGame = useGameStore((s) => s.startFixMiniGame);
  const fixPhase = useGameStore((s) => s.fixPhase);
  const fixMiniGame = useGameStore((s) => s.fixMiniGame);
  const fixQuizAttemptsCurrent = useGameStore((s) => s.fixQuizAttemptsCurrent);
  const completedFixToolsCurrent = useGameStore((s) => s.completedFixToolsCurrent);

  const zoom = useInspectionViewVrStore((s) => s.zoom);
  const rotation = useInspectionViewVrStore((s) => s.rotation);
  const offset = useInspectionViewVrStore((s) => s.offset);
  const panMode = useInspectionViewVrStore((s) => s.panMode);
  const flowError = useInspectionViewVrStore((s) => s.flowError);
  const resetView = useInspectionViewVrStore((s) => s.resetView);
  const setZoom = useInspectionViewVrStore((s) => s.setZoom);
  const setRotation = useInspectionViewVrStore((s) => s.setRotation);
  const setOffset = useInspectionViewVrStore((s) => s.setOffset);
  const setPanMode = useInspectionViewVrStore((s) => s.setPanMode);
  const setFlowError = useInspectionViewVrStore((s) => s.setFlowError);

  const allDefects = useMemo(
    () => [
      {
        defectClass: wafer.defectClass,
        severity: wafer.severity,
        defectLoad: wafer.defectLoad,
        defectPattern: wafer.defectPattern
      },
      ...wafer.secondaryDefects
    ],
    [wafer]
  );

  const visibleDefects = useMemo(
    () =>
      allDefects.filter((defect) => {
        const bestTool = optimalToolByDefect[defect.defectClass];
        return tool === bestTool || (defect.defectClass === "benign" && tool === "brightfield");
      }),
    [allDefects, tool]
  );
  const canRevealDefect = visibleDefects.length > 0;
  const recommendedTool = optimalToolByDefect[wafer.defectClass];
  const dominantDefect = useMemo(
    () =>
      [...allDefects].sort((a, b) => b.severity - a.severity || b.defectLoad - a.defectLoad)[0] ?? {
        defectClass: wafer.defectClass,
        severity: wafer.severity,
        defectLoad: wafer.defectLoad,
        defectPattern: wafer.defectPattern
      },
    [allDefects, wafer.defectClass, wafer.defectLoad, wafer.defectPattern, wafer.severity]
  );
  const requiredFixTool = fixToolByDefect[dominantDefect.defectClass];
  const caseContext = useMemo(
    () => ({
      defectKinds: Array.from(new Set(allDefects.map((defect) => defect.defectClass))).length,
      hasConnectivityRisk: allDefects.some((defect) => defect.defectClass === "bridge" || defect.defectClass === "open"),
      severeCount: allDefects.filter((defect) => defect.severity === 3).length
    }),
    [allDefects]
  );

  const mechanismOptions = useMemo(
    () => buildMechanismOptions(wafer, caseContext, fixQuizAttemptsCurrent),
    [caseContext, fixQuizAttemptsCurrent, wafer]
  );
  const sequenceOptions = useMemo(
    () => buildSequenceOptions(wafer, requiredFixTool, fixQuizAttemptsCurrent),
    [fixQuizAttemptsCurrent, requiredFixTool, wafer]
  );
  const releaseOptions = useMemo(
    () => buildReleaseOptions(wafer, caseContext, fixQuizAttemptsCurrent),
    [caseContext, fixQuizAttemptsCurrent, wafer]
  );
  const fixToolOptions = useMemo(
    () => buildFixToolShuffle(wafer, fixQuizAttemptsCurrent),
    [fixQuizAttemptsCurrent, wafer]
  );

  const { inspectionConfidence, requiredThreshold, canMarkComplete } = useMemo(
    () =>
      computeInspectionConfidence({
        wafer,
        zoom,
        rotation,
        canRevealDefect,
        visibleDefectCount: visibleDefects.length,
        totalDefectCount: allDefects.length,
        tool,
        recommendedTool
      }),
    [allDefects.length, canRevealDefect, recommendedTool, rotation, tool, visibleDefects.length, wafer, zoom]
  );

  const defectMarkers = useMemo(() => buildDefectMarkers(wafer, allDefects), [allDefects, wafer]);
  const visibleDefectClasses = useMemo(() => new Set(visibleDefects.map((d) => d.defectClass)), [visibleDefects]);
  const visibleMarkers = useMemo(
    () => defectMarkers.filter((m) => visibleDefectClasses.has(m.defectClass)),
    [defectMarkers, visibleDefectClasses]
  );

  const dispositionGuidance = useMemo(() => getDispositionGuidance(wafer, currentDay), [currentDay, wafer]);
  const requiredFixTools = useMemo(
    () =>
      Array.from(
        new Set(
          allDefects
            .filter((defect) => defectCatalog[defect.defectClass].reworkable)
            .map((defect) => fixToolByDefect[defect.defectClass])
        )
      ),
    [allDefects]
  );
  const pendingFixTools = useMemo(
    () => requiredFixTools.filter((ft) => !completedFixToolsCurrent.includes(ft)),
    [completedFixToolsCurrent, requiredFixTools]
  );

  const findingsPages = useMemo(
    () =>
      buildInspectionFindingsPages({
        tool,
        selectedFixTool,
        inspectionConfidence,
        requiredThreshold,
        currentDay,
        dispositionGuidance,
        requiredFixTools,
        pendingFixTools,
        canRevealDefect
      }),
    [
      canRevealDefect,
      currentDay,
      dispositionGuidance,
      inspectionConfidence,
      pendingFixTools,
      requiredFixTools,
      requiredThreshold,
      selectedFixTool,
      tool,
      wafer
    ]
  );

  const fixStatusLine =
    fixPhase === "mini_game" && fixMiniGame
      ? `Fix sim: ${fixMiniGame.tool} | ${fixMiniGame.progress}% | tries ${fixQuizAttemptsCurrent}`
      : fixPhase === "applied"
        ? "Fix phase: Applied"
        : fixPhase === "quiz"
          ? "Fix quiz in progress"
          : "";

  const evidenceLine = canRevealDefect
    ? "Evidence present — validate in multiple views."
    : "Insufficient evidence — adjust tool, zoom, and angle.";

  const nudge = useCallback(
    (dx: number, dy: number, playCue: (c: "soft") => void) => {
      playCue("soft");
      if (panMode) {
        setOffset((o) => ({ x: o.x + dx * 0.04, z: o.z + dy * 0.04 }));
      } else {
        setRotation((r) => ({ x: Math.max(-55, Math.min(55, r.x + dy)), y: r.y + dx }));
      }
    },
    [panMode, setOffset, setRotation]
  );

  return {
    isOpen,
    close,
    complete,
    currentDay,
    wafer,
    tool,
    setTool,
    selectedFixTool,
    setSelectedFixTool,
    startFixQuiz,
    cancelFixQuiz,
    submitFixQuizAttempt,
    startFixMiniGame,
    fixPhase,
    fixMiniGame,
    fixQuizAttemptsCurrent,
    allDefects,
    visibleDefects,
    canRevealDefect,
    recommendedTool,
    requiredFixTool,
    mechanismOptions,
    sequenceOptions,
    releaseOptions,
    fixToolOptions,
    inspectionConfidence,
    requiredThreshold,
    canMarkComplete,
    visibleMarkers,
    dispositionGuidance,
    pendingFixTools,
    findingsPages,
    fixStatusLine,
    evidenceLine,
    zoom,
    rotation,
    offset,
    panMode,
    flowError,
    resetView,
    setZoom,
    setRotation,
    setOffset,
    setPanMode,
    setFlowError,
    nudge,
    toolLabels,
    fixToolLabels,
    viewTools: Object.keys(toolLabels) as InspectionTool[],
    fixTools: Object.keys(fixToolLabels) as FixTool[]
  };
}

export type VrInspectionBenchShared = ReturnType<typeof useVrInspectionBenchShared>;
