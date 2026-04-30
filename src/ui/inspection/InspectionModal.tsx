"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import { defectCatalog } from "@/game/config/defects";
import { getDispositionGuidance } from "@/game/engine/decision-thresholds";
import {
  fixToolByDefect,
  fixToolLabels,
  optimalToolByDefect,
  toolLabels,
  type FixTool,
  type InspectionTool
} from "@/game/inspection-tools";
import { useGameStore } from "@/game/store/game-store";
import { FixMiniGameHost } from "@/ui/inspection/FixMiniGameHost";

type QuizAnswers = {
  tool: FixTool | null;
  mechanism: string | null;
  sequence: string | null;
  release: string | null;
};
type QuizOption = {
  id: string;
  label: string;
  rationale: string;
  isCorrect: boolean;
};

function hashString(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seeded(seed: string): number {
  return (hashString(seed) % 10000) / 10000;
}

function shuffleDeterministic<T>(items: T[], seed: string): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(seeded(`${seed}-${i}`) * (i + 1));
    [next[i], next[j]] = [next[j] as T, next[i] as T];
  }
  return next;
}

export function InspectionModal() {
  const currentDay = useGameStore((s) => s.currentDay);
  const wafer = useGameStore((s) => s.currentWafer);
  const isOpen = useGameStore((s) => s.inspectionOpen);
  const close = useGameStore((s) => s.closeInspection);
  const complete = useGameStore((s) => s.completeInspection);
  const tool = useGameStore((s) => s.selectedTool);
  const setTool = useGameStore((s) => s.setSelectedTool);
  const selectedFixTool = useGameStore((s) => s.selectedFixTool);
  const setSelectedFixTool = useGameStore((s) => s.setSelectedFixTool);
  const startFixQuiz = useGameStore((s) => s.startFixQuiz);
  const submitFixQuizAttempt = useGameStore((s) => s.submitFixQuizAttempt);
  const startFixMiniGame = useGameStore((s) => s.startFixMiniGame);
  const fixPhase = useGameStore((s) => s.fixPhase);
  const fixMiniGame = useGameStore((s) => s.fixMiniGame);
  const fixQuizAttemptsCurrent = useGameStore((s) => s.fixQuizAttemptsCurrent);
  const completedFixToolsCurrent = useGameStore((s) => s.completedFixToolsCurrent);

  const [zoom, setZoom] = useState(1.1);
  const [rotation, setRotation] = useState({ x: 10, y: -20 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [isFixQuizOpen, setIsFixQuizOpen] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [fixMiniGameError, setFixMiniGameError] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({
    tool: null,
    mechanism: null,
    sequence: null,
    release: null
  });
  const resetFixFlow = () => {
    setIsFixQuizOpen(false);
    setQuizError(null);
    setFixMiniGameError(null);
    setQuizAnswers({ tool: null, mechanism: null, sequence: null, release: null });
  };

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
    () => requiredFixTools.filter((fixTool) => !completedFixToolsCurrent.includes(fixTool)),
    [completedFixToolsCurrent, requiredFixTools]
  );
  const dispositionGuidance = useMemo(() => getDispositionGuidance(wafer, currentDay), [currentDay, wafer]);
  const riskToneClass =
    dispositionGuidance.riskBand === "critical"
      ? "status-bad"
      : dispositionGuidance.riskBand === "high"
        ? "status-bad"
        : dispositionGuidance.riskBand === "moderate"
          ? "status-warn"
          : "status-ok";
  const caseContext = useMemo(
    () => ({
      defectKinds: Array.from(new Set(allDefects.map((defect) => defect.defectClass))).length,
      hasConnectivityRisk: allDefects.some((defect) => defect.defectClass === "bridge" || defect.defectClass === "open"),
      severeCount: allDefects.filter((defect) => defect.severity === 3).length
    }),
    [allDefects]
  );
  const requiredThreshold = wafer.severity === 3 || wafer.defectClass === "bridge" || wafer.defectClass === "open" ? 78 : 64;
  const zoomScore = Math.max(0, Math.min(30, Math.round((zoom - 0.8) * 20)));
  const angleDelta = Math.abs(rotation.x - 10) + Math.abs(rotation.y + 20);
  const angleScore = Math.min(18, Math.round(angleDelta / 4));
  const signalScore = canRevealDefect ? Math.min(32, 8 + Math.round((visibleDefects.length / allDefects.length) * 24)) : 8;
  const toolScore = tool === recommendedTool ? 20 : 5;
  const inspectionConfidence = Math.min(100, zoomScore + angleScore + signalScore + toolScore);
  const canMarkComplete = inspectionConfidence >= requiredThreshold;
  const defectMarkers = useMemo(() => {
    const count = Math.min(
      8,
      Math.max(
        1,
        wafer.defectLoad + wafer.secondaryDefects.length
      )
    );
    return Array.from({ length: count }).map((_, index) => {
      const defect = allDefects[index % allDefects.length];
      const spread = defect.defectPattern === 4 ? 68 : defect.defectPattern === 3 ? 60 : defect.defectPattern === 2 ? 50 : 42;
      const x = 50 + (seeded(`${wafer.id}-${defect.defectClass}-${index}-x`) - 0.5) * spread;
      const y = 50 + (seeded(`${wafer.id}-${defect.defectClass}-${index}-y`) - 0.5) * spread;
      const rot = Math.round(seeded(`${wafer.id}-${defect.defectClass}-${index}-r`) * 180 - 90);
      const size =
        defect.defectClass === "particle"
          ? 10 + seeded(`${wafer.id}-${index}-s`) * 13
          : defect.defectClass === "scratch"
            ? 22 + seeded(`${wafer.id}-${index}-s`) * 30
            : 18 + seeded(`${wafer.id}-${index}-s`) * 22;
      const variant = ((index + wafer.defectPattern) % 3) + 1;
      return { x, y, rot, size, variant, defectClass: defect.defectClass };
    });
  }, [allDefects, wafer.defectLoad, wafer.defectPattern, wafer.id, wafer.secondaryDefects.length]);
  const visibleDefectClasses = useMemo(() => new Set(visibleDefects.map((defect) => defect.defectClass)), [visibleDefects]);
  const visibleMarkers = useMemo(
    () => defectMarkers.filter((marker) => visibleDefectClasses.has(marker.defectClass)),
    [defectMarkers, visibleDefectClasses]
  );
  const mechanismOptions = useMemo<QuizOption[]>(() => {
    const severeDefectPresent = caseContext.severeCount > 0;
    const hasConnectivityRisk = caseContext.hasConnectivityRisk;
    const correctLabel = hasConnectivityRisk
      ? "Prioritize mechanism containment because unresolved connectivity signatures can cause latent downstream electrical fallout."
      : severeDefectPresent
        ? "Prioritize mechanism containment because unresolved high-severity signatures can collapse process margin and yield."
        : "Prioritize mechanism containment because unresolved local signatures can propagate into downstream yield loss.";
    const optionPool: QuizOption[] = [
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
  }, [caseContext.hasConnectivityRisk, caseContext.severeCount, fixQuizAttemptsCurrent, wafer.id]);
  const sequenceOptions = useMemo<QuizOption[]>(() => {
    const sequenceFrames = [
      `Verify in multiple views, align wafer, apply ${fixToolLabels[requiredFixTool]}, then re-verify stability before release.`,
      `Cross-check signal first, execute ${fixToolLabels[requiredFixTool]} intervention, then confirm post-fix residual risk.`,
      `Validate signature, perform controlled ${fixToolLabels[requiredFixTool]} action, and complete post-repair verification before disposition.`
    ];
    const optionPool: QuizOption[] = [
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
  }, [fixQuizAttemptsCurrent, requiredFixTool, wafer.id]);
  const releaseOptions = useMemo<QuizOption[]>(() => {
    const hasKiller = caseContext.severeCount > 0 || caseContext.hasConnectivityRisk;
    const optionPool: QuizOption[] = [
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
  }, [caseContext.hasConnectivityRisk, caseContext.severeCount, fixQuizAttemptsCurrent, wafer.id]);
  const fixToolOptions = useMemo(
    () => shuffleDeterministic((Object.keys(fixToolLabels) as FixTool[]), `${wafer.id}-fixtool-${fixQuizAttemptsCurrent}`),
    [fixQuizAttemptsCurrent, wafer.id]
  );

  const submitFixQuiz = () => {
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
    submitFixQuizAttempt(isCorrect);
    if (!isCorrect) {
      const misses = [];
      if (!isToolCorrect) misses.push("Tool competency miss: choose the repair tool that matches dominant mechanism.");
      if (!isMechanismCorrect) misses.push("Risk competency miss: prioritize yield/reliability over throughput shortcuts.");
      if (!isSequenceCorrect) misses.push("Sequence competency miss: keep verify-before and verify-after repair.");
      if (!isReleaseCorrect) misses.push("Release competency miss: disposition must follow post-fix stability.");
      setQuizError(`Score ${score}/4. ${misses.join(" ")}`);
      return;
    }
    if (quizAnswers.tool) {
      setSelectedFixTool(quizAnswers.tool);
    }
    setQuizError(null);
    setIsFixQuizOpen(false);
    startFixMiniGame();
    setQuizAnswers({ tool: null, mechanism: null, sequence: null, release: null });
  };
  const resetView = () => {
    setZoom(1.1);
    setRotation({ x: 10, y: -20 });
    setOffset({ x: 0, y: 0 });
    setParallax({ x: 0, y: 0 });
  };
  const isRepairInteractionLocked = fixPhase === "mini_game";
  const waferStyle: CSSProperties & Record<string, string> = {
    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
    "--parallax-x": `${parallax.x}px`,
    "--parallax-y": `${parallax.y}px`
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="overlay-modal" role="dialog" aria-modal="true" aria-labelledby="inspect-title">
      <div className="overlay-card inspect-card">
        <div className="inspect-header">
          <div className="panel-head">
            <span className="panel-tag">Inspection Console</span>
            <span className="panel-subtag">Wafer {wafer.id}</span>
          </div>
          <h2 id="inspect-title">Microscope Workbench</h2>
          <p>
            Drag to rotate. Hold <span className="kbd">Shift</span> + drag to pan. Scroll or buttons to zoom.
          </p>
        </div>
        <div className="inspect-controls">
          <label className="tool-select">
            <span className="panel-subtag">Viewing tool</span>
            <select value={tool} onChange={(event) => setTool(event.target.value as InspectionTool)} className="a11y-select">
              {(Object.keys(toolLabels) as InspectionTool[]).map((entry) => (
                <option key={entry} value={entry}>
                  {toolLabels[entry]}
                </option>
              ))}
            </select>
          </label>
          <label className="tool-select">
            <span className="panel-subtag">Fix tool</span>
            <select
              value={selectedFixTool}
              onChange={(event) => setSelectedFixTool(event.target.value as FixTool)}
              className="a11y-select"
              disabled={fixPhase === "mini_game"}
            >
              {(Object.keys(fixToolLabels) as FixTool[]).map((entry) => (
                <option key={entry} value={entry}>
                  {fixToolLabels[entry]}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={resetView}>
            Reset View
          </button>
          <button type="button" onClick={() => setOffset({ x: 0, y: 0 })}>
            Recenter
          </button>
        </div>
        <div className="inspect-grid">
          <div
            className={`inspect-viewport ${isRepairInteractionLocked ? "inspect-viewport-repair-mode" : ""}`}
            onWheel={(event) => {
              if (isRepairInteractionLocked) return;
              event.preventDefault();
              const delta = event.deltaY > 0 ? -0.05 : 0.05;
              setZoom((v) => Math.min(2.4, Math.max(0.8, v + delta)));
            }}
            onMouseDown={(event) => {
              if (isRepairInteractionLocked) return;
              dragRef.current = { x: event.clientX, y: event.clientY };
            }}
            onMouseUp={() => {
              dragRef.current = null;
            }}
            onMouseLeave={() => {
              dragRef.current = null;
              setParallax({ x: 0, y: 0 });
            }}
            onMouseMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const normX = (event.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
              const normY = (event.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
              setParallax({ x: normX * 10, y: normY * 8 });
              if (isRepairInteractionLocked) return;
              if (!dragRef.current) return;
              const dx = event.clientX - dragRef.current.x;
              const dy = event.clientY - dragRef.current.y;
              dragRef.current = { x: event.clientX, y: event.clientY };
              if (event.shiftKey) {
                setOffset((prev) => ({ x: prev.x + dx * 0.25, y: prev.y + dy * 0.25 }));
              } else {
                setRotation((prev) => ({ x: prev.x + dy * 0.16, y: prev.y + dx * 0.16 }));
              }
            }}
          >
            <div className="inspect-zoom-pad">
              <button type="button" onClick={() => setZoom((v) => Math.max(0.8, v - 0.1))}>
                -
              </button>
              <button type="button" onClick={() => setZoom((v) => Math.min(2.4, v + 0.1))}>
                +
              </button>
            </div>
            <div
              className={`wafer-model ${canRevealDefect ? "defect-visible" : ""}`}
              style={waferStyle}
            >
              <div className="wafer-rim" />
              <div className="wafer-noise" />
              <div className="wafer-rings" />
              <div className="wafer-gloss" />
              <div className="wafer-bevel" />
              <div className="wafer-grid" />
              {canRevealDefect
                ? visibleMarkers.map((marker, index) => (
                    <div
                      key={`${wafer.id}-${marker.defectClass}-${index}`}
                      className={`defect-marker defect-${marker.defectClass}`}
                      style={{
                        top: `${marker.y}%`,
                        left: `${marker.x}%`,
                        transform: `translate(-50%, -50%) rotate(${marker.rot}deg) translateZ(${marker.defectClass === "bridge" || marker.defectClass === "open" ? 3 : 1}px)`,
                        width: `${marker.size}px`,
                        height: marker.defectClass === "scratch" ? "5px" : marker.defectClass === "misalignment" ? "12px" : `${marker.size}px`,
                        opacity: 0.75 + marker.variant * 0.08
                      }}
                    />
                  ))
                : null}
            </div>
          </div>
          <div className="inspect-findings panel-block">
            <h3>Findings</h3>
            <p>
              Capture evidence from multiple views. One tool alone can hide important process risk.
            </p>
            <p>Current view tool: {toolLabels[tool]}</p>
            <p>Current fix tool: {fixToolLabels[selectedFixTool]}</p>
            <p>
              Inspection confidence: <strong>{inspectionConfidence}%</strong> (clearance threshold {requiredThreshold}%)
            </p>
            <div className="inspect-threshold">
              <div className="inspect-threshold-bar" style={{ width: `${inspectionConfidence}%` }} />
            </div>
            <h3>Inspector Guide</h3>
            <p>
              <strong>Interpretation method</strong>: observe, cross-check in at least two modes, then decide disposition from
              repeatable evidence rather than a single visual cue.
            </p>
            <p>
              <strong>Particle-like signature</strong>: small scattered points that brighten with angle/contrast changes and often appear in clusters.
            </p>
            <p>
              <strong>Line/mechanical signature</strong>: elongated or directional marks that persist while rotating the wafer.
            </p>
            <p>
              <strong>Connectivity-risk signature</strong>: discontinuities or unintended links that remain stable across multiple views.
            </p>
            <p>
              <strong>Benign/cosmetic signature</strong>: low-intensity marks that fade or disappear when cross-checked and do not
              show persistent structure.
            </p>
            <p>
              <strong>Disposition rule of thumb</strong>: accept only when risk remains low after verification; repair when the
              mechanism is fixable and validation is stable; reject when severe or persistent risk remains.
            </p>
            {currentDay === 1 && dispositionGuidance.dispositionCall ? (
              <p>
                <strong>Current call</strong>: {dispositionGuidance.dispositionCall}
              </p>
            ) : null}
            <div className="inline-row">
              <span className={`status-chip ${riskToneClass}`}>Risk: {dispositionGuidance.riskBand}</span>
              {wafer.reworkEligible ? <span className="status-chip status-warn">Manual Fix Available</span> : null}
            </div>
            <p>
              <strong>{currentDay === 3 ? "Minimal hint" : "Reasoning hints"}</strong>:
            </p>
            <ul className="decision-cue-list">
              {dispositionGuidance.visualSignals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
            {currentDay <= 2 ? (
              <>
                <p>
                  <strong>Why this call</strong>:
                </p>
                <ul className="decision-cue-list">
                  {dispositionGuidance.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </>
            ) : null}
            <h3>Manual Fix Guide</h3>
            <p><strong>Tool hints by signature</strong>:</p>
            <p>
              <strong>Micro Polish</strong>: use when marks look shallow/mechanical (fine scratches, mild surface drag, edge scuff-like artifacts).
            </p>
            <p>
              <strong>Plasma Clean</strong>: use when defect appears particulate/film-like (speckle clusters, haze, residue-style scatter).
            </p>
            <p>
              <strong>Laser Trim</strong>: use when pattern suggests feature continuity issue (bridge/open-like connectivity signatures).
            </p>
            <p>
              <strong>Execution flow</strong>: choose likely tool -&gt; pass verification -&gt; clear all repair nodes -&gt; re-inspect in two modes before disposition.
            </p>
            {requiredFixTools.length > 1 ? (
              <>
                <p>
                  <strong>Multi-defect repair</strong>: this wafer has multiple fixable mechanisms. Complete every required tool pass before accept.
                </p>
                <p>
                  Remaining tools:{" "}
                  {pendingFixTools.length > 0
                    ? pendingFixTools.map((toolEntry) => fixToolLabels[toolEntry]).join(", ")
                    : "None"}
                </p>
              </>
            ) : null}
          </div>
        </div>
        <div className="inspect-footer">
          <p className="status-chip status-warn">
            {canRevealDefect
              ? "Evidence present. Validate in multiple views before final disposition."
              : "Insufficient evidence. Adjust angle, zoom, and tool to continue investigation."}
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => {
                if (fixPhase === "mini_game") {
                  setFixMiniGameError("Complete active tool simulation before starting another fix flow.");
                  return;
                }
                startFixQuiz();
                setQuizAnswers({ tool: null, mechanism: null, sequence: null, release: null });
                setQuizError(null);
                setIsFixQuizOpen(true);
              }}
              disabled={!wafer.reworkEligible}
            >
              Apply Manual Fix
            </button>
            <button type="button" onClick={() => {
              resetFixFlow();
              close();
            }}>
              Close
            </button>
            <button type="button" onClick={complete} disabled={!canMarkComplete}>
              Mark Inspection Complete
            </button>
          </div>
        </div>
        {fixPhase === "mini_game" ? (
          <p className="status-chip status-warn">
            Fix Mini-Game: {fixMiniGame?.tool.replace("-", " ")} | Progress {fixMiniGame?.progress ?? 0}% | Attempts{" "}
            {fixQuizAttemptsCurrent}
          </p>
        ) : null}
        {fixPhase === "applied" ? <p className="status-chip status-ok">Fix phase: Applied</p> : null}
        {fixMiniGameError ? <p className="status-chip status-bad">{fixMiniGameError}</p> : null}
      </div>
      {isFixQuizOpen ? (
        <div className="fix-quiz-overlay" role="dialog" aria-modal="true" aria-labelledby="fix-quiz-title">
          <div className="fix-quiz-card">
            <h3 id="fix-quiz-title">Manual Fix Verification</h3>
            <p>
              Case brief: {allDefects.map((defect) => defect.defectClass).join(", ")} | Severity {wafer.severity}/3 | Load {wafer.defectLoad}/5.
              Choose the best process-safe response before repair is authorized.
            </p>
            <div className="fix-quiz-group">
              <strong>1) Which repair tool is required for this defect?</strong>
              <div className="fix-quiz-options">
                {fixToolOptions.map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    className={quizAnswers.tool === entry ? "active-tool quiz-option-selected" : ""}
                    onClick={() => setQuizAnswers((prev) => ({ ...prev, tool: entry }))}
                  >
                    {fixToolLabels[entry]}
                  </button>
                ))}
              </div>
            </div>
            <div className="fix-quiz-group">
              <strong>2) What is the key fab risk in this case?</strong>
              <div className="fix-quiz-options">
                {mechanismOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={quizAnswers.mechanism === option.id ? "quiz-option-selected" : ""}
                    onClick={() => setQuizAnswers((prev) => ({ ...prev, mechanism: option.id }))}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="fix-quiz-group">
              <strong>3) Which process sequence is correct?</strong>
              <div className="fix-quiz-options">
                {sequenceOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={quizAnswers.sequence === option.id ? "quiz-option-selected" : ""}
                    onClick={() => setQuizAnswers((prev) => ({ ...prev, sequence: option.id }))}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="fix-quiz-group">
              <strong>4) What is the correct release rule after manual fix?</strong>
              <div className="fix-quiz-options">
                {releaseOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={quizAnswers.release === option.id ? "quiz-option-selected" : ""}
                    onClick={() => setQuizAnswers((prev) => ({ ...prev, release: option.id }))}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            {quizError ? <p className="status-chip status-bad">{quizError}</p> : null}
            <div className="tutorial-actions">
              <button type="button" onClick={() => setIsFixQuizOpen(false)}>
                Cancel
              </button>
              <button type="button" onClick={submitFixQuiz}>
                Submit and Apply Fix
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {fixPhase === "mini_game" ? (
        <div className="fix-mini-game-overlay" role="dialog" aria-modal="true" aria-labelledby="fix-minigame-title">
          <div className="fix-mini-game-card">
            <h3 id="fix-minigame-title">Manual Fix Simulation</h3>
            <FixMiniGameHost />
          </div>
        </div>
      ) : null}
    </div>
  );
}
