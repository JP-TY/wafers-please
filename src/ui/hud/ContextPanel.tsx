"use client";

import { useMemo, useState } from "react";
import { getDispositionGuidance } from "@/game/engine/decision-thresholds";
import { useGameStore } from "@/game/store/game-store";
import { toolLabels } from "@/game/inspection-tools";
import { useUiAudio } from "@/ui/audio/useUiAudio";

type ContextTab = "learn" | "data" | "quiz";

const tabLabels: Record<ContextTab, string> = {
  learn: "Learn",
  data: "Data",
  quiz: "Quiz"
};

export function ContextPanel() {
  const [tab, setTab] = useState<ContextTab>("learn");
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const currentDay = useGameStore((s) => s.currentDay);
  const wafer = useGameStore((s) => s.currentWafer);
  const inspected = useGameStore((s) => s.hasInspectedCurrent);
  const usedRework = useGameStore((s) => s.usedReworkOnCurrent);
  const phase = useGameStore((s) => s.phase);
  const acc = useGameStore((s) => s.accumulator);
  const openInspection = useGameStore((s) => s.openInspection);
  const actOnWafer = useGameStore((s) => s.actOnWafer);
  const { playCue } = useUiAudio();
  const requiresInspectionLock = !inspected && acc.processed === 0;
  const guidance = useMemo(() => getDispositionGuidance(wafer, currentDay), [currentDay, wafer]);
  const riskToneClass =
    guidance.riskBand === "critical"
      ? "status-bad"
      : guidance.riskBand === "high"
        ? "status-bad"
        : guidance.riskBand === "moderate"
          ? "status-warn"
          : "status-ok";

  const missionTasks = useMemo(
    () => [
      { id: "inspect", label: "Inspect Wafer Surface", xp: 15, done: inspected },
      { id: "classify", label: "Classify Defect & Risk", xp: 20, done: inspected },
      { id: "disposition", label: "Submit Disposition", xp: 25, done: acc.processed > 0 }
    ],
    [acc.processed, inspected]
  );

  return (
    <aside className="rail right-rail" aria-label="Training context and mission controls">
      <section className="console-panel">
        <div className="panel-head">
          <span className="panel-tag">Interactive Simulation</span>
          <span className="panel-subtag">Current Mission</span>
        </div>
        <div className="tab-row" role="tablist" aria-label="Context tabs">
          {(Object.keys(tabLabels) as ContextTab[]).map((entry) => (
            <button
              key={entry}
              type="button"
              className={`tab-btn ${tab === entry ? "tab-active" : ""}`}
              onClick={() => {
                setTab(entry);
                playCue("soft");
              }}
              role="tab"
              aria-selected={tab === entry}
            >
              {tabLabels[entry]}
            </button>
          ))}
        </div>
        {tab === "learn" ? (
          <div className="panel-block">
            <h3>Learning Goal</h3>
            <p>
              Determine whether incoming wafer <strong>{wafer.id}</strong> should be accepted, rejected, or
              reworked using inspection evidence.
            </p>
            <p>
              Best inspection mode for this defect family is usually <strong>{toolLabels[wafer.reworkEligible ? "darkfield" : "brightfield"]}</strong>{" "}
              before disposition.
            </p>
          </div>
        ) : null}
        {tab === "data" ? (
          <div className="panel-block">
            <h3>Process Snapshot</h3>
            <p>Defect Class: {wafer.defectClass}</p>
            <p>Rework Candidate: {wafer.reworkEligible ? "Yes" : "No"}</p>
            <p>Shift Throughput: {acc.processed} wafers</p>
            <p>False Accepts: {acc.falseAccepts}</p>
            <p>False Rejects: {acc.falseRejects}</p>
            {currentDay === 1 && guidance.dispositionCall ? (
              <p>
                Decision Call: <strong>{guidance.dispositionCall}</strong>
              </p>
            ) : null}
            <div className="inline-row">
              <span className={`status-chip ${riskToneClass}`}>Risk: {guidance.riskBand}</span>
              {wafer.reworkEligible ? <span className="status-chip status-warn">Fix Path Active</span> : null}
              {acc.falseAccepts >= 2 ? <span className="status-chip status-bad">Strict Reject Bias</span> : null}
            </div>
            <p>{currentDay === 3 ? "Minimal hint:" : "Reasoning hints:"}</p>
            <ul className="decision-cue-list">
              {guidance.visualSignals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {tab === "quiz" ? (
          <div className="panel-block">
            <h3>Knowledge Check</h3>
            <p>Which tool mode best confirms this type of anomaly before disposition?</p>
            <div className="quiz-choices">
              {(["brightfield", "darkfield", "uv"] as const).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => {
                    setQuizAnswer(choice);
                    playCue(choice === "uv" ? "confirm" : "warn");
                  }}
                >
                  {toolLabels[choice]}
                </button>
              ))}
            </div>
            {quizAnswer ? (
              <p className={`status-chip ${quizAnswer === "uv" ? "status-ok" : "status-warn"}`}>
                {quizAnswer === "uv"
                  ? "Correct: UV gives strongest bridge/open contrast."
                  : "Not ideal here. Retry and compare with UV mode."}
              </p>
            ) : (
              <p className="status-chip status-warn">Use inspection tools before final action.</p>
            )}
          </div>
        ) : null}
      </section>

      <section className="console-panel">
        <div className="panel-head">
          <span className="panel-tag">Mission Task Stack</span>
          <span className="panel-subtag">3 Tasks</span>
        </div>
        <div className="task-list">
          {missionTasks.map((task) => (
            <div key={task.id} className={`task-item ${task.done ? "task-done" : ""}`}>
              <div>
                <strong>{task.label}</strong>
                <p>{task.done ? "Done" : "Pending"}</p>
              </div>
              <span>{task.xp} XP</span>
            </div>
          ))}
        </div>
      </section>

      <section className="console-panel">
        <div className="panel-head">
          <span className="panel-tag">Control Console</span>
          <span className="panel-subtag">Shortcut Aligned</span>
        </div>
        <div className="control-grid">
          <button
            type="button"
            onClick={() => {
              openInspection();
              playCue("soft");
            }}
            disabled={phase !== "running"}
          >
            Inspect (I)
          </button>
          <button
            type="button"
            onClick={() => {
              actOnWafer("accept");
              playCue("confirm");
            }}
            disabled={phase !== "running" || requiresInspectionLock}
          >
            Accept (1)
          </button>
          <button
            type="button"
            onClick={() => {
              actOnWafer("reject");
              playCue("warn");
            }}
            disabled={phase !== "running" || requiresInspectionLock}
          >
            Reject (2)
          </button>
          <button
            type="button"
            onClick={() => {
              openInspection();
              playCue("warn");
            }}
            disabled={phase !== "running"}
            aria-pressed={usedRework}
          >
            Rework (3)
          </button>
        </div>
      </section>
    </aside>
  );
}
