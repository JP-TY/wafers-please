"use client";

import { useEffect } from "react";
import { useGameStore } from "@/game/store/game-store";
import { useUiAudio } from "@/ui/audio/useUiAudio";

export function ActionTray() {
  const openInspection = useGameStore((s) => s.openInspection);
  const actOnWafer = useGameStore((s) => s.actOnWafer);
  const usedRework = useGameStore((s) => s.usedReworkOnCurrent);
  const inspected = useGameStore((s) => s.hasInspectedCurrent);
  const inspectionOpen = useGameStore((s) => s.inspectionOpen);
  const phase = useGameStore((s) => s.phase);
  const processed = useGameStore((s) => s.accumulator.processed);
  const { playCue } = useUiAudio();
  const requiresInspectionLock = !inspected && processed === 0;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (phase !== "running") return;
      const key = event.key.toLowerCase();
      if (inspectionOpen && key !== "i") return;
      if (key === "i") {
        openInspection();
        playCue("soft");
      }
      if (key === "3") {
        openInspection();
        playCue("warn");
      }
      if (key === "1") {
        actOnWafer("accept");
        playCue("confirm");
      }
      if (key === "2") {
        actOnWafer("reject");
        playCue("warn");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [actOnWafer, inspectionOpen, openInspection, phase, playCue]);

  return (
    <section className="console-panel">
      <div className="panel-head">
        <span className="panel-tag">Disposition Console</span>
        <span className="panel-subtag">Operator Controls</span>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.45rem" }}>
        <button
          type="button"
          onClick={() => {
            openInspection();
            playCue("soft");
          }}
          disabled={phase !== "running"}
        >
          Open Inspection
        </button>
        <button
          type="button"
          onClick={() => {
            openInspection();
            playCue("warn");
          }}
          aria-pressed={usedRework}
          disabled={phase !== "running"}
        >
          Mark Rework
        </button>
        <button
          type="button"
          onClick={() => {
            actOnWafer("accept");
            playCue("confirm");
          }}
          disabled={phase !== "running" || requiresInspectionLock}
        >
          Accept Wafer
        </button>
        <button
          type="button"
          onClick={() => {
            actOnWafer("reject");
            playCue("warn");
          }}
          disabled={phase !== "running" || requiresInspectionLock}
        >
          Reject Wafer
        </button>
      </div>
      <div className="inline-row">
        <span className={inspected ? "status-chip status-ok" : "status-chip status-warn"}>
          {inspected ? "Inspection Complete" : "Inspect Required"}
        </span>
        <span className={usedRework ? "status-chip status-warn" : "status-chip"}>
          {usedRework ? "Rework Marked" : "No Rework Flag"}
        </span>
      </div>
      <div className="panel-block">
        <h3>Shortcut Legend</h3>
        <p>
          <span className="kbd">I</span> Inspect <span className="kbd">1</span> Accept <span className="kbd">2</span>{" "}
          Reject <span className="kbd">3</span> Rework
        </p>
      </div>
    </section>
  );
}
