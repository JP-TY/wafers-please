"use client";

import "aframe";
import { useEffect, useRef } from "react";
import { createElement as h } from "react";
import { useGameStore } from "@/game/store/game-store";
import { useUiAudio } from "@/ui/audio/useUiAudio";
import { InspectionStation } from "@/webvr/components/inspection-station";
import { registerAFrameComponents } from "@/webvr/components/register-components";

export default function AFrameClientScene() {
  const pointerRelockCooldownMs = 260;
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const pointerUnlockCooldownUntilRef = useRef(0);
  const wafer = useGameStore((s) => s.currentWafer);
  const phase = useGameStore((s) => s.phase);
  const inspectionOpen = useGameStore((s) => s.inspectionOpen);
  const result = useGameStore((s) => s.result);
  const fixPhase = useGameStore((s) => s.fixPhase);
  const hasInspected = useGameStore((s) => s.hasInspectedCurrent);
  const usedRework = useGameStore((s) => s.usedReworkOnCurrent);
  const toolPickupNotice = useGameStore((s) => s.toolPickupNotice);
  const openInspection = useGameStore((s) => s.openInspection);
  const clearToolPickupNotice = useGameStore((s) => s.clearToolPickupNotice);
  const actOnWafer = useGameStore((s) => s.actOnWafer);
  const setElapsedSeconds = useGameStore((s) => s.setElapsedSeconds);
  const { playCue } = useUiAudio();

  useEffect(() => {
    registerAFrameComponents();
  }, []);

  const overlayActive = inspectionOpen || Boolean(result) || fixPhase === "mini_game";

  useEffect(() => {
    const container = wrapRef.current;
    if (!container) return;

    const requestLock = (event: MouseEvent) => {
      if (event.button !== 0) return;
      if (overlayActive || phase !== "running") return;
      if (Date.now() < pointerUnlockCooldownUntilRef.current) return;
      if (!document.pointerLockElement) {
        container.requestPointerLock?.();
      }
    };
    const onPointerLockChange = () => {
      if (!document.pointerLockElement) {
        pointerUnlockCooldownUntilRef.current = Date.now() + pointerRelockCooldownMs;
      }
    };

    container.addEventListener("click", requestLock);
    document.addEventListener("pointerlockchange", onPointerLockChange);
    return () => {
      container.removeEventListener("click", requestLock);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
    };
  }, [overlayActive, phase]);

  useEffect(() => {
    if (!overlayActive) return;
    if (document.pointerLockElement) {
      document.exitPointerLock();
      pointerUnlockCooldownUntilRef.current = Date.now() + pointerRelockCooldownMs;
    }
  }, [overlayActive, pointerRelockCooldownMs]);

  useEffect(() => {
    if (phase !== "running") {
      return;
    }
    const interval = window.setInterval(() => {
      const currentElapsed = useGameStore.getState().elapsedSeconds;
      setElapsedSeconds(currentElapsed + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [phase, setElapsedSeconds]);

  useEffect(() => {
    if (!toolPickupNotice) return;
    const clearTimer = window.setTimeout(() => clearToolPickupNotice(), 1300);
    return () => {
      window.clearTimeout(clearTimer);
    };
  }, [clearToolPickupNotice, toolPickupNotice]);

  return (
    <div className="scene-wrap" aria-label="3D inspection station scene" ref={wrapRef}>
      {h("a-scene", {
        embedded: true,
        "vr-mode-ui": "enabled: true",
        renderer: "colorManagement: true; antialias: true; physicallyCorrectLights: true; toneMapping: ACESFilmic; exposure: 1.08; sortObjects: true"
      }, [
        h("a-sky", { color: "#1d3244", key: "sky" }),
        h("a-entity", { light: "type: ambient; intensity: 0.72; color: #bfe2ff", key: "amb" }),
        h("a-entity", {
          light: "type: directional; intensity: 1.18; castShadow: true; shadowBias: -0.0002; shadowMapHeight: 2048; shadowMapWidth: 2048",
          position: "1.7 3.4 2.2",
          key: "dir"
        }),
        h("a-entity", { light: "type: point; intensity: 0.62; distance: 14; color: #9bd4ff", position: "0 2.8 -3", key: "pt" }),
        h(InspectionStation, {
          wafer,
          hasInspected,
          usedRework,
          onInspect: () => {
            openInspection();
            playCue("soft");
          },
          onAccept: () => {
            actOnWafer("accept");
            playCue("confirm");
          },
          onReject: () => {
            actOnWafer("reject");
            playCue("warn");
          },
          onRework: () => {
            openInspection();
            playCue("warn");
          },
          key: "station"
        }),
        h("a-camera", {
          position: "0 1.48 0.92",
          "look-controls": "enabled: true; pointerLockEnabled: true; reverseMouseDrag: false",
          "wasd-controls": "enabled: true; acceleration: 14",
          key: "cam"
        }, [
          h("a-entity", {
            cursor: "fuse: false",
            raycaster: "objects: .clickable; far: 20",
            position: "0 0 -1",
            key: "camcursor"
          })
        ])
      ])}
      <div className={`scene-reticle ${toolPickupNotice ? "reticle-pulse" : ""}`} aria-hidden="true" />
      {toolPickupNotice ? <div className="scene-feedback">{toolPickupNotice}</div> : null}
    </div>
  );
}
