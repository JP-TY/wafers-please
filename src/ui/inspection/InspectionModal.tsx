"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import { defectCatalog } from "@/game/config/defects";
import { getDispositionGuidance } from "@/game/engine/decision-thresholds";
import {
  buildFixToolShuffle,
  buildMechanismOptions,
  buildReleaseOptions,
  buildSequenceOptions,
  evaluateFixQuizSubmission,
  type FixQuizAnswers
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
import { FixMiniGameHost } from "@/ui/inspection/FixMiniGameHost";

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
  const cancelFixQuiz = useGameStore((s) => s.cancelFixQuiz);
  const submitFixQuizAttempt = useGameStore((s) => s.submitFixQuizAttempt);
  const startFixMiniGame = useGameStore((s) => s.startFixMiniGame);
  const fixPhase = useGameStore((s) => s.fixPhase);
  const fixMiniGame = useGameStore((s) => s.fixMiniGame);
  const fixQuizAttemptsCurrent = useGameStore((s) => s.fixQuizAttemptsCurrent);
  const completedFixToolsCurrent = useGameStore((s) => s.completedFixToolsCurrent);
  const playModePreference = useGameStore((s) => s.playModePreference);
  const isVrUi = playModePreference === "vr";

  const [zoom, setZoom] = useState(1.1);
  const [rotation, setRotation] = useState({ x: 10, y: -20 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [vrPanMode, setVrPanMode] = useState(false);
  const pointerDragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const [isFixQuizOpen, setIsFixQuizOpen] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [fixMiniGameError, setFixMiniGameError] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<FixQuizAnswers>({
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
  const visibleDefectClasses = useMemo(() => new Set(visibleDefects.map((defect) => defect.defectClass)), [visibleDefects]);
  const visibleMarkers = useMemo(
    () => defectMarkers.filter((marker) => visibleDefectClasses.has(marker.defectClass)),
    [defectMarkers, visibleDefectClasses]
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

  const submitFixQuiz = () => {
    const { isCorrect, score, misses } = evaluateFixQuizSubmission({
      quizAnswers,
      mechanismOptions,
      sequenceOptions,
      releaseOptions,
      requiredFixTool
    });
    submitFixQuizAttempt(isCorrect);
    if (!isCorrect) {
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

  const onViewportPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isRepairInteractionLocked) return;
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerDragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
  };

  const onViewportPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const normX = (event.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
    const normY = (event.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
    setParallax({ x: normX * 10, y: normY * 8 });
    if (isRepairInteractionLocked) return;
    const drag = pointerDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    pointerDragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    const panning = event.shiftKey || (isVrUi && vrPanMode);
    if (panning) {
      setOffset((prev) => ({ x: prev.x + dx * 0.25, y: prev.y + dy * 0.25 }));
    } else {
      setRotation((prev) => ({ x: prev.x + dy * 0.16, y: prev.y + dx * 0.16 }));
    }
  };

  const onViewportPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = pointerDragRef.current;
    if (drag && drag.pointerId === event.pointerId) {
      pointerDragRef.current = null;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
    }
    setParallax({ x: 0, y: 0 });
  };

  return (
    <div className={`overlay-modal${isVrUi ? " overlay-modal--xr" : ""}`} role="dialog" aria-modal="true" aria-labelledby="inspect-title">
      <div className={`overlay-card inspect-card${isVrUi ? " inspect-card--xr" : ""}`}>
        <div className="inspect-header">
          <div className="panel-head">
            <span className="panel-tag">Inspection Console</span>
            <span className="panel-subtag">Wafer {wafer.id}</span>
          </div>
          <h2 id="inspect-title">Microscope Workbench</h2>
          <p>
            {isVrUi ? (
              <>
                <strong>WebXR:</strong> Press and hold on the wafer with your laser, then drag to rotate. Use{" "}
                <strong>+ / −</strong> to zoom. Turn on <strong>Pan mode</strong> to drag-pan instead of rotate. Use the
                nudge buttons if drag is awkward.
              </>
            ) : (
              <>
                Drag to rotate. Hold <span className="kbd">Shift</span> + drag to pan. Scroll or buttons to zoom.
              </>
            )}
          </p>
        </div>
        <div className={`inspect-controls${isVrUi ? " inspect-controls--xr" : ""}`}>
          {isVrUi ? (
            <>
              <div className="inspect-tool-grid" role="group" aria-label="Viewing tool">
                <span className="panel-subtag inspect-tool-grid-label">Viewing tool</span>
                {(Object.keys(toolLabels) as InspectionTool[]).map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    className={tool === entry ? "inspect-tool-tile active-tool" : "inspect-tool-tile"}
                    onClick={() => setTool(entry)}
                  >
                    {toolLabels[entry]}
                  </button>
                ))}
              </div>
              <div className="inspect-tool-grid" role="group" aria-label="Fix tool">
                <span className="panel-subtag inspect-tool-grid-label">Fix tool</span>
                {(Object.keys(fixToolLabels) as FixTool[]).map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    className={selectedFixTool === entry ? "inspect-tool-tile active-tool" : "inspect-tool-tile"}
                    onClick={() => setSelectedFixTool(entry)}
                    disabled={fixPhase === "mini_game"}
                  >
                    {fixToolLabels[entry]}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
          <button type="button" onClick={resetView}>
            Reset View
          </button>
          <button type="button" onClick={() => setOffset({ x: 0, y: 0 })}>
            Recenter
          </button>
          {isVrUi ? (
            <button
              type="button"
              className={vrPanMode ? "active-tool" : ""}
              onClick={() => setVrPanMode((v) => !v)}
              aria-pressed={vrPanMode}
            >
              {vrPanMode ? "Pan mode on" : "Pan mode off"}
            </button>
          ) : null}
        </div>
        <div className={`inspect-grid${isVrUi ? " inspect-grid--xr" : ""}`}>
          <div
            className={`inspect-viewport ${isRepairInteractionLocked ? "inspect-viewport-repair-mode" : ""}${isVrUi ? " inspect-viewport--xr" : ""}`}
            style={isVrUi ? ({ touchAction: "none" } as CSSProperties) : undefined}
            onWheel={(event) => {
              if (isRepairInteractionLocked) return;
              event.preventDefault();
              const delta = event.deltaY > 0 ? -0.05 : 0.05;
              setZoom((v) => Math.min(2.4, Math.max(0.8, v + delta)));
            }}
            onPointerDown={onViewportPointerDown}
            onPointerMove={onViewportPointerMove}
            onPointerUp={onViewportPointerUp}
            onPointerCancel={onViewportPointerUp}
            onPointerLeave={(event) => {
              if (!pointerDragRef.current || pointerDragRef.current.pointerId !== event.pointerId) {
                setParallax({ x: 0, y: 0 });
              }
            }}
          >
            <div className="inspect-zoom-pad">
              <button type="button" aria-label="Zoom out" onClick={() => setZoom((v) => Math.max(0.8, v - 0.1))}>
                −
              </button>
              <button type="button" aria-label="Zoom in" onClick={() => setZoom((v) => Math.min(2.4, v + 0.1))}>
                +
              </button>
            </div>
            {isVrUi ? (
              <div className="inspect-vr-nudges" aria-label="Wafer view nudge controls">
                <button type="button" onClick={() => setRotation((p) => ({ ...p, y: p.y - 14 }))} aria-label="Rotate left">
                  ↺
                </button>
                <button type="button" onClick={() => setRotation((p) => ({ ...p, y: p.y + 14 }))} aria-label="Rotate right">
                  ↻
                </button>
                <button type="button" onClick={() => setRotation((p) => ({ ...p, x: Math.min(55, p.x + 10) }))} aria-label="Tilt down">
                  ↓
                </button>
                <button type="button" onClick={() => setRotation((p) => ({ ...p, x: Math.max(-55, p.x - 10) }))} aria-label="Tilt up">
                  ↑
                </button>
              </div>
            ) : null}
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
        <div className={`inspect-footer${isVrUi ? " inspect-footer--xr" : ""}`}>
          <p className="status-chip status-warn">
            {canRevealDefect
              ? "Evidence present. Validate in multiple views before final disposition."
              : "Insufficient evidence. Adjust angle, zoom, and tool to continue investigation."}
          </p>
          <div className={`inspect-footer-actions${isVrUi ? " inspect-footer-actions--xr" : ""}`}>
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
        <div className={`fix-quiz-overlay${isVrUi ? " fix-quiz-overlay--xr" : ""}`} role="dialog" aria-modal="true" aria-labelledby="fix-quiz-title">
          <div className={`fix-quiz-card${isVrUi ? " fix-quiz-card--xr" : ""}`}>
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
                    className={[
                      "fix-quiz-option",
                      isVrUi ? "fix-quiz-option--xr" : "",
                      quizAnswers.tool === entry ? "active-tool quiz-option-selected" : ""
                    ]
                      .filter(Boolean)
                      .join(" ")}
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
                    className={[
                      "fix-quiz-option",
                      isVrUi ? "fix-quiz-option--xr" : "",
                      quizAnswers.mechanism === option.id ? "quiz-option-selected" : ""
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setQuizAnswers((prev) => ({ ...prev, mechanism: option.id }))}
                    title={isVrUi ? option.label : undefined}
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
                    className={[
                      "fix-quiz-option",
                      isVrUi ? "fix-quiz-option--xr" : "",
                      quizAnswers.sequence === option.id ? "quiz-option-selected" : ""
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setQuizAnswers((prev) => ({ ...prev, sequence: option.id }))}
                    title={isVrUi ? option.label : undefined}
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
                    className={[
                      "fix-quiz-option",
                      isVrUi ? "fix-quiz-option--xr" : "",
                      quizAnswers.release === option.id ? "quiz-option-selected" : ""
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setQuizAnswers((prev) => ({ ...prev, release: option.id }))}
                    title={isVrUi ? option.label : undefined}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            {quizError ? <p className="status-chip status-bad">{quizError}</p> : null}
            <div className="tutorial-actions">
              <button
                type="button"
                onClick={() => {
                  setIsFixQuizOpen(false);
                  cancelFixQuiz();
                }}
              >
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
        <div className={`fix-mini-game-overlay${isVrUi ? " fix-mini-game-overlay--xr" : ""}`} role="dialog" aria-modal="true" aria-labelledby="fix-minigame-title">
          <div className={`fix-mini-game-card${isVrUi ? " fix-mini-game-card--xr" : ""}`}>
            <h3 id="fix-minigame-title">Manual Fix Simulation</h3>
            <FixMiniGameHost />
          </div>
        </div>
      ) : null}
    </div>
  );
}
