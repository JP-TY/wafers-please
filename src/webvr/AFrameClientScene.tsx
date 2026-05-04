"use client";

import "aframe";
import { useEffect, useRef, useState } from "react";
import { createElement as h } from "react";
import { useGameStore } from "@/game/store/game-store";
import { useUiAudio } from "@/ui/audio/useUiAudio";
import { InspectionStation } from "@/webvr/components/inspection-station";
import { registerAFrameComponents } from "@/webvr/components/register-components";
import { VrCameraStack } from "@/webvr/vr-native/VrCameraStack";
import { VR_RAYCAST_SELECTOR } from "@/webvr/vr-native/vr-layout-constants";
import { VrNativeWorld } from "@/webvr/vr-native/VrNativeWorld";

type ASceneElement = HTMLElement & {
  hasLoaded?: boolean;
  enterVR?: (force?: boolean) => Promise<void> | void;
};

export default function AFrameClientScene() {
  const pointerRelockCooldownMs = 260;
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const pointerUnlockCooldownUntilRef = useRef(0);
  const vrEnterAttemptedRef = useRef(false);

  const playModePreference = useGameStore((s) => s.playModePreference);
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

  const [vrPresent, setVrPresent] = useState(false);

  const vrPreferred = playModePreference === "vr";

  useEffect(() => {
    registerAFrameComponents();
  }, []);

  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;
    const scene = root.querySelector("a-scene") as ASceneElement | null;
    if (!scene) return;
    const onEnter = () => setVrPresent(true);
    const onExit = () => setVrPresent(false);
    scene.addEventListener("enter-vr", onEnter);
    scene.addEventListener("exit-vr", onExit);
    return () => {
      scene.removeEventListener("enter-vr", onEnter);
      scene.removeEventListener("exit-vr", onExit);
    };
  }, [playModePreference]);

  useEffect(() => {
    if (!vrPreferred || vrEnterAttemptedRef.current) return;
    const root = wrapRef.current;
    if (!root) return;
    const scene = root.querySelector("a-scene") as ASceneElement | null;
    if (!scene) return;

    const tryEnter = () => {
      if (vrEnterAttemptedRef.current) return;
      vrEnterAttemptedRef.current = true;
      const maybePromise = scene.enterVR?.(false);
      if (maybePromise && typeof (maybePromise as Promise<void>).catch === "function") {
        (maybePromise as Promise<void>).catch(() => {
          vrEnterAttemptedRef.current = false;
        });
      }
    };

    if (scene.hasLoaded) {
      window.requestAnimationFrame(tryEnter);
    } else {
      scene.addEventListener("loaded", () => window.requestAnimationFrame(tryEnter), { once: true });
    }
  }, [vrPreferred]);

  const overlayActive = inspectionOpen || Boolean(result) || fixPhase === "mini_game";
  const pointerLockEligible = playModePreference === "desktop" && !vrPresent;

  useEffect(() => {
    const container = wrapRef.current;
    if (!container) return;
    if (!pointerLockEligible) return;

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
  }, [overlayActive, phase, pointerLockEligible, pointerRelockCooldownMs]);

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

  const embedded = !vrPreferred;
  /* VR uses in-scene native UI; dom-overlay optional for debugging mirror only. */
  const webxrAttr = vrPreferred
    ? "requiredFeatures: local-floor; optionalFeatures: bounded-floor,dom-overlay"
    : "requiredFeatures: local-floor; optionalFeatures: bounded-floor";
  const lookControls = vrPresent
    ? "enabled: true; pointerLockEnabled: false; touchEnabled: false"
    : `enabled: true; pointerLockEnabled: ${pointerLockEligible}; touchEnabled: false`;
  const wasdEnabled = !vrPresent;

  return (
    <div className="scene-wrap" aria-label="3D inspection station scene" ref={wrapRef}>
      {h("a-scene", {
        embedded,
        "vr-mode-ui": "enabled: true",
        webxr: webxrAttr,
        renderer:
          "colorManagement: true; antialias: true; physicallyCorrectLights: true; toneMapping: ACESFilmic; exposure: 1.08; sortObjects: true"
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
        vrPreferred ? h(VrNativeWorld, { key: "vr-native-world" }) : null,
        h(
          "a-entity",
          {
            id: "xr-locomotion-rig",
            position: "0 0 0",
            "vr-thumbstick-locomotion": "speed: 0.34; deadzone: 0.18",
            "wasd-controls": `enabled: ${wasdEnabled}; acceleration: 3`,
            key: "xr-rig"
          },
          [
            h("a-camera", {
              position: "0 1.48 0.92",
              "look-controls": lookControls,
              key: "cam"
            }, [
              h("a-entity", {
                cursor: "fuse: false",
                raycaster: `objects: ${VR_RAYCAST_SELECTOR}; far: 24`,
                position: "0 0 -1",
                key: "camcursor"
              }),
              h("a-entity", {
                "laser-controls": "hand: right",
                raycaster: `objects: ${VR_RAYCAST_SELECTOR}; far: 24; showLine: true`,
                line: "color: #62d1ff; opacity: 0.78",
                key: "laserright"
              }),
              h("a-entity", {
                "laser-controls": "hand: left",
                raycaster: `objects: ${VR_RAYCAST_SELECTOR}; far: 24; showLine: true`,
                line: "color: #7dffcc; opacity: 0.65",
                key: "laserleft"
              }),
              vrPreferred ? h(VrCameraStack, { key: "vr-cam-stack" }) : null
            ])
          ]
        )
      ])}
      {!vrPresent ? <div className={`scene-reticle ${toolPickupNotice ? "reticle-pulse" : ""}`} aria-hidden="true" /> : null}
      {toolPickupNotice ? <div className="scene-feedback">{toolPickupNotice}</div> : null}
    </div>
  );
}
