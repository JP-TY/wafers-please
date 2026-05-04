"use client";

import dynamic from "next/dynamic";
import { fixToolLabels, toolLabels } from "@/game/inspection-tools";
import { useGameStore } from "@/game/store/game-store";
import { DebriefModal } from "@/ui/debrief/DebriefModal";
import { InspectionModal } from "@/ui/inspection/InspectionModal";
import { StartMenu } from "@/ui/start-menu/StartMenu";
import { VrDomUiPortal } from "@/ui/xr/VrDomUiPortal";

const AFrameClientScene = dynamic(() => import("@/webvr/AFrameClientScene"), {
  ssr: false
});
const TutorialOverlay = dynamic(() => import("@/ui/tutorial/TutorialOverlay").then((mod) => mod.TutorialOverlay), {
  ssr: false
});

export default function HomePage() {
  const sessionPhase = useGameStore((s) => s.sessionPhase);
  const playModePreference = useGameStore((s) => s.playModePreference);
  const wafer = useGameStore((s) => s.currentWafer);
  const currentDay = useGameStore((s) => s.currentDay);
  const currentRules = useGameStore((s) => s.currentRules);
  const hasInspected = useGameStore((s) => s.hasInspectedCurrent);
  const elapsedSeconds = useGameStore((s) => s.elapsedSeconds);
  const selectedTool = useGameStore((s) => s.selectedTool);
  const selectedFixTool = useGameStore((s) => s.selectedFixTool);
  const accumulator = useGameStore((s) => s.accumulator);
  const inspectionOpen = useGameStore((s) => s.inspectionOpen);
  const sessionPlaying = sessionPhase === "playing";

  const shiftTime = `${Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, "0")}:${(elapsedSeconds % 60).toString().padStart(2, "0")}`;
  const competency =
    accumulator.processed === 0 ? 0 : Math.round((accumulator.correctDecisions / accumulator.processed) * 100);

  return (
    <main>
      <StartMenu />
      <div className="game-stage" aria-label="Interactive simulation center">
        {sessionPlaying ? (
          <>
            {playModePreference === "desktop" ? (
              <VrDomUiPortal enabled={sessionPlaying} isVrUi={false}>
                {!inspectionOpen ? (
                  <div className="hud-strip">
                    <div className="hud-grid">
                      <span className="panel-subtag">Day {currentDay}</span>
                      <span className="panel-subtag">Desktop console</span>
                      <span className="status-chip">Wafer {wafer.id}</span>
                      <span className={hasInspected ? "status-chip status-ok" : "status-chip status-warn"}>
                        {hasInspected ? "Disposition Enabled" : "Inspect Required"}
                      </span>
                      <span className="status-chip">Shift {shiftTime}</span>
                      <span
                        className={
                          competency >= currentRules.competencyTarget ? "status-chip status-ok" : "status-chip status-warn"
                        }
                      >
                        Accuracy {competency}%
                      </span>
                      <span className={accumulator.salary >= currentRules.salaryTarget ? "status-chip status-ok" : "status-chip"}>
                        Salary ${accumulator.salary}
                      </span>
                      <span className={accumulator.comboStreak >= 2 ? "status-chip status-ok" : "status-chip"}>
                        Combo x{accumulator.comboStreak}
                      </span>
                      <span className="status-chip">First-Try Fix {accumulator.firstTryFixSuccesses}</span>
                      <span className="status-chip">View {toolLabels[selectedTool]}</span>
                      <span className="status-chip">Fix {fixToolLabels[selectedFixTool]}</span>
                    </div>
                    <div className="hud-help">
                      <span className="panel-tag">Controls</span>
                      <span className="panel-subtag">Mouse Look</span>
                      <span className="panel-subtag">WASD Move</span>
                      <span className="panel-subtag">Click Interact</span>
                    </div>
                  </div>
                ) : null}
                {currentDay === 1 ? <TutorialOverlay /> : null}
                <DebriefModal />
                <InspectionModal key={wafer.id} />
              </VrDomUiPortal>
            ) : null}
            <AFrameClientScene />
          </>
        ) : null}
      </div>
    </main>
  );
}
