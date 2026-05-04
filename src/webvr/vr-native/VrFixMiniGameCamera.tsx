"use client";

import { createElement as h, useRef } from "react";
import type { FixMiniGameState } from "@/game/types";
import { useGameStore } from "@/game/store/game-store";
import { useFixMiniGameSuccessApply, useFixMiniGameTick } from "@/ui/inspection/use-fix-mini-game-tick";
import { useUiAudio } from "@/ui/audio/useUiAudio";
import { VR_HIT_CLASSES } from "@/webvr/vr-native/vr-layout-constants";

function circularPhaseDistance(a: number, b: number): number {
  const direct = Math.abs(a - b);
  return Math.min(direct, 1 - direct);
}

function laserPhase(miniGame: FixMiniGameState): number {
  const base = (miniGame.elapsedMs / 1000) * miniGame.difficulty.speed;
  return base - Math.floor(base);
}

export function VrFixMiniGameCamera() {
  const { playCue } = useUiAudio();
  const fixPhase = useGameStore((s) => s.fixPhase);
  const miniGame = useGameStore((s) => s.fixMiniGame);
  const registerHit = useGameStore((s) => s.registerFixMiniGameHit);
  const registerMiss = useGameStore((s) => s.registerFixMiniGameMiss);
  const abortMiniGame = useGameStore((s) => s.abortMiniGame);

  const sprayRef = useRef<{ targetId: string | null; frame: number | null; last: number }>({
    targetId: null,
    frame: null,
    last: 0
  });
  const holdRef = useRef<{ timer: number | null; id: string | null }>({ timer: null, id: null });

  useFixMiniGameTick();
  useFixMiniGameSuccessApply();

  if (fixPhase !== "mini_game" || !miniGame) return null;

  const stopSpray = () => {
    const s = sprayRef.current;
    s.targetId = null;
    if (s.frame != null) {
      cancelAnimationFrame(s.frame);
      s.frame = null;
    }
  };

  const tickSpray = (now: number) => {
    const s = sprayRef.current;
    if (!s.targetId) return;
    if (now - s.last >= 65) {
      registerHit(s.targetId);
      s.last = now;
    }
    s.frame = requestAnimationFrame(tickSpray);
  };

  const clearHoldTimer = () => {
    const t = holdRef.current.timer;
    if (t != null) window.clearTimeout(t);
    holdRef.current.timer = null;
    holdRef.current.id = null;
  };

  const backdrop = h("a-plane", {
    position: "0 -0.22 -0.72",
    rotation: "0 0 0",
    width: 0.95,
    height: 0.52,
    color: "#0c1520",
    opacity: 0.92,
    transparent: true,
    shader: "flat"
  });

  const title = h("a-text", {
    position: "0 0.12 -0.71",
    value: `${miniGame.tool.replace("-", " ")} | ${miniGame.progress}% | miss ${miniGame.failures}/${miniGame.difficulty.maxMisses} | ${Math.max(0, Math.ceil((miniGame.timeLimitMs - miniGame.elapsedMs) / 1000))}s`,
    width: 1.5,
    align: "center",
    color: "#9fe8ff"
  });

  const msg = h("a-text", {
    position: "0 -0.38 -0.71",
    value: miniGame.message.slice(0, 120),
    width: 1.35,
    align: "center",
    color: "#cfefff"
  });

  const boardW = 0.72;
  const boardH = 0.34;

  const targets3d = miniGame.targets.map((target) => {
    const px = (target.x / 100 - 0.5) * boardW;
    const py = -(target.y / 100 - 0.5) * boardH;
    const sz = Math.max(0.04, target.radius / 700);
    const base = {
      position: `${px.toFixed(3)} ${py.toFixed(3)} -0.7`,
      class: VR_HIT_CLASSES,
      width: sz,
      height: sz,
      depth: 0.025,
      color: target.cleared ? "#55e8b2" : "#5ac8ff"
    } as const;

    if (miniGame.tool === "laser-trim") {
      const phase = laserPhase(miniGame);
      const gateCenter = target.windowCenter ?? 0.5;
      const gateSize = target.windowSize ?? 0.1;
      const offset = circularPhaseDistance(phase, gateCenter);
      const inWindow = offset <= gateSize;
      return h("a-box", {
        ...base,
        key: target.id,
        material: inWindow ? "emissive: #2244aa; emissiveIntensity: 0.35" : "emissive: #000000; emissiveIntensity: 0",
        onClick: () => {
          const mg = useGameStore.getState().fixMiniGame;
          if (!mg || target.cleared) return;
          const livePhase = laserPhase(mg);
          const gc = target.windowCenter ?? 0.5;
          const gs = target.windowSize ?? 0.1;
          const off = circularPhaseDistance(livePhase, gc);
          if (off > gs) {
            registerMiss("Pulse outside trim window.");
            return;
          }
          registerHit(target.id, { timingOffset: off });
        }
      });
    }

    if (miniGame.tool === "plasma-clean") {
      return h("a-box", {
        ...base,
        key: target.id,
        onMouseDown: () => {
          stopSpray();
          registerHit(target.id);
          sprayRef.current.targetId = target.id;
          sprayRef.current.last = 0;
          sprayRef.current.frame = requestAnimationFrame(tickSpray);
        },
        onMouseUp: stopSpray,
        onMouseLeave: stopSpray
      });
    }

    const nextId = miniGame.targets[miniGame.currentTargetIndex]?.id;
    return h("a-box", {
      ...base,
      key: target.id,
      color: nextId === target.id ? "#ffd68c" : base.color,
      onMouseDown: () => {
        if (nextId !== target.id) {
          registerMiss("Follow path order for micro polish.");
          return;
        }
        clearHoldTimer();
        holdRef.current.id = target.id;
        holdRef.current.timer = window.setTimeout(() => {
          registerHit(target.id);
          clearHoldTimer();
        }, 420);
      },
      onMouseUp: () => {
        if (holdRef.current.id === target.id && holdRef.current.timer != null) {
          registerMiss("Polish path unstable. Hold steady on checkpoint.");
        }
        if (holdRef.current.id === target.id) {
          clearHoldTimer();
        }
      },
      onMouseLeave: () => {
        if (holdRef.current.id === target.id && holdRef.current.timer != null) {
          registerMiss("Polish path unstable. Hold steady on checkpoint.");
        }
        if (holdRef.current.id === target.id) {
          clearHoldTimer();
        }
      }
    });
  });

  return h("a-entity", { "data-vr-fix": "1" }, [
    backdrop,
    title,
    msg,
    h("a-entity", { position: "0 -0.05 0" }, targets3d),
    miniGame.phase === "failed"
      ? h("a-box", {
          key: "abort",
          position: "0.32 -0.32 -0.69",
          width: 0.12,
          height: 0.06,
          depth: 0.03,
          color: "#aa4455",
          class: VR_HIT_CLASSES,
          onClick: () => {
            playCue("warn");
            abortMiniGame();
          }
        })
      : null,
    miniGame.phase === "failed"
      ? h("a-text", { position: "0.32 -0.22 -0.69", value: "Abort quiz", width: 2, align: "center", color: "#fff" })
      : null
  ]);
}
