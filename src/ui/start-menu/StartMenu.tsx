"use client";

import type { PlayModePreference } from "@/game/types";
import { useGameStore } from "@/game/store/game-store";

export function StartMenu() {
  const sessionPhase = useGameStore((s) => s.sessionPhase);
  const beginSession = useGameStore((s) => s.beginSession);

  if (sessionPhase !== "menu") {
    return null;
  }

  const onChoose = (mode: PlayModePreference) => {
    beginSession(mode);
  };

  return (
    <div className="start-menu-overlay" role="dialog" aria-modal="true" aria-labelledby="start-menu-title">
      <div className="start-menu-card">
        <p className="panel-tag start-menu-eyebrow">Semiconductor inspection training</p>
        <h1 id="start-menu-title" className="start-menu-title">
          Wafers, Please!
        </h1>
        <p className="start-menu-lede">
          Run a shift at the wafer review station: inspect, fix when required, and disposition each lot before the timer ends.
        </p>
        <ul className="start-menu-bullets">
          <li>Desktop: mouse look, WASD, and click the station controls.</li>
          <li>Headset: WebXR immersive mode with controller laser pointers on supported browsers (HTTPS required when hosted).</li>
        </ul>
        <div className="start-menu-actions">
          <button type="button" className="start-menu-btn start-menu-btn-primary" onClick={() => onChoose("desktop")}>
            Play on desktop
          </button>
          <button type="button" className="start-menu-btn start-menu-btn-secondary" onClick={() => onChoose("vr")}>
            Play in headset (WebXR)
          </button>
        </div>
        <p className="start-menu-footnote">
          If immersive mode does not start automatically, use the Enter VR control in the corner after the scene loads. On desktop
          you can use the Chrome extension &quot;WebXR API Emulator&quot; (DevTools WebXR tab) to test without a headset.
        </p>
      </div>
    </div>
  );
}
