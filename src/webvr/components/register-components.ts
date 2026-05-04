import "aframe";

let isRegistered = false;

export function registerAFrameComponents(): void {
  if (isRegistered || typeof window === "undefined") {
    return;
  }

  const AFRAME = (window as Window & { AFRAME?: typeof globalThis }).AFRAME as
    | {
        registerComponent: (name: string, definition: Record<string, unknown>) => void;
      }
    | undefined;
  if (!AFRAME) {
    return;
  }

  AFRAME.registerComponent("wafer-spin", {
    schema: { speed: { type: "number", default: 0.35 } },
    tick(_time: number, dt: number) {
      const self = this as { el: { object3D: { rotation: { y: number } } }; data: { speed: number } };
      self.el.object3D.rotation.y += (dt / 1000) * self.data.speed;
    }
  });

  AFRAME.registerComponent("pulse-highlight", {
    schema: { min: { type: "number", default: 0.35 }, max: { type: "number", default: 0.75 } },
    tick(time: number) {
      const self = this as {
        el: { getObject3D: (kind: string) => { material?: { emissiveIntensity?: number } } | undefined };
        data: { min: number; max: number };
      };
      const mesh = self.el.getObject3D("mesh");
      const material = mesh?.material;
      if (!material) return;
      const pulse = (Math.sin(time / 300) + 1) / 2;
      material.emissiveIntensity = self.data.min + pulse * (self.data.max - self.data.min);
    }
  });

  AFRAME.registerComponent("hover-glint", {
    init() {
      const self = this as {
        el: {
          addEventListener: (name: string, cb: () => void) => void;
          object3D: { scale: { set: (x: number, y: number, z: number) => void } };
          getObject3D: (kind: string) => { material?: { emissiveIntensity?: number } } | undefined;
        };
      };
      const setState = (isHover: boolean) => {
        const scale = isHover ? 1.08 : 1;
        self.el.object3D.scale.set(scale, scale, scale);
        const material = self.el.getObject3D("mesh")?.material as
          | { emissiveIntensity?: number; color?: { offsetHSL: (h: number, s: number, l: number) => void } }
          | undefined;
        if (material) {
          if (material.color) {
            material.color.offsetHSL(0, 0, isHover ? 0.08 : -0.08);
          }
          material.emissiveIntensity = isHover ? 0.45 : 0.08;
        }
      };
      self.el.addEventListener("mouseenter", () => setState(true));
      self.el.addEventListener("mouseleave", () => setState(false));
      setState(false);
    }
  });

  AFRAME.registerComponent("vr-thumbstick-locomotion", {
    schema: {
      speed: { type: "number", default: 0.72 },
      deadzone: { type: "number", default: 0.18 }
    },
    tick(_time: number, dt: number) {
      const Af = (window as Window & { AFRAME?: { THREE?: Record<string, unknown> } }).AFRAME;
      type Vec3 = {
        addScaledVector: (v: Vec3, s: number) => unknown;
        lengthSq: () => number;
      };
      const THREE = Af?.THREE as { Vector3: new (x?: number, y?: number, z?: number) => Vec3 } | undefined;
      const self = this as {
        el: {
          object3D: { position: { add: (v: { lengthSq: () => number }) => void } };
          sceneEl?: { is: (state: string) => boolean };
          querySelector: (sel: string) => { object3D: { rotation: { y: number } } } | null;
        };
        data: { speed: number; deadzone: number };
      };
      const sceneEl = self.el.sceneEl;
      if (!sceneEl || !sceneEl.is("vr-mode") || !THREE) return;

      const pads = typeof navigator !== "undefined" ? navigator.getGamepads() : [];
      const dead = self.data.deadzone;
      let ax = 0;
      let ay = 0;
      let used = 0;
      for (let i = 0; i < pads.length; i += 1) {
        const pad = pads[i];
        if (!pad?.axes || pad.axes.length < 2) continue;
        const x = pad.axes[0] ?? 0;
        const y = pad.axes[1] ?? 0;
        if (Math.abs(x) <= dead && Math.abs(y) <= dead) continue;
        ax += x;
        ay += y;
        used += 1;
      }
      if (used === 0) return;
      ax /= used;
      ay /= used;

      const cam = self.el.querySelector("[camera]");
      if (!cam) return;
      const yaw = cam.object3D.rotation.y;
      const forward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
      const right = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));
      const secs = dt / 1000;
      const step = self.data.speed * secs;
      const move = new THREE.Vector3(0, 0, 0);
      move.addScaledVector(right, ax * step);
      move.addScaledVector(forward, -ay * step);
      if (move.lengthSq() < 1e-8) return;
      self.el.object3D.position.add(move);
    }
  });

  AFRAME.registerComponent("desktop-look", {
    schema: { sensitivity: { type: "number", default: 0.0016 } },
    init() {
      const self = this as {
        el: { object3D: { rotation: { x: number; y: number; order: string } } };
        data: { sensitivity: number };
      };
      let dragging = false;
      let lastX = 0;
      let lastY = 0;
      const onDown = () => {
        dragging = true;
      };
      const onUp = () => {
        dragging = false;
      };
      const onMove = (event: MouseEvent) => {
        const isPointerLocked = document.pointerLockElement !== null;
        if (!isPointerLocked && !dragging) return;
        const dx = event.movementX || (lastX ? event.clientX - lastX : 0);
        const dy = event.movementY || (lastY ? event.clientY - lastY : 0);
        lastX = event.clientX;
        lastY = event.clientY;
        const rot = self.el.object3D.rotation;
        rot.order = "YXZ";
        rot.y -= dx * self.data.sensitivity;
        rot.x -= dy * self.data.sensitivity;
        const maxPitch = Math.PI / 2.2;
        rot.x = Math.max(-maxPitch, Math.min(maxPitch, rot.x));
      };
      window.addEventListener("mousedown", onDown);
      window.addEventListener("mouseup", onUp);
      window.addEventListener("mousemove", onMove);
    }
  });

  isRegistered = true;
}
