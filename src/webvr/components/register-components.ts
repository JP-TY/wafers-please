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
      speed: { type: "number", default: 0.34 },
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

  const DESKTOP_MOVE_KEYS = new Set([
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
    "ArrowUp",
    "ArrowLeft",
    "ArrowRight",
    "ArrowDown"
  ]);

  function shouldCaptureDesktopKeys(event: KeyboardEvent): boolean {
    const target = event.target;
    if (!target || !(target instanceof HTMLElement)) return true;
    if (target.isContentEditable) return false;
    const tag = target.tagName;
    return tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT";
  }

  /** Replaces stock `wasd-controls` on the rig: uses camera yaw + capped speed (rig rotation stays 0). */
  AFRAME.registerComponent("desktop-rig-locomotion", {
    schema: {
      enabled: { type: "boolean", default: true },
      maxSpeed: { type: "number", default: 0.32 },
      acceleration: { type: "number", default: 4.2 },
      friction: { type: "number", default: 14 }
    },
    init() {
      const self = this as {
        data: { enabled: boolean; maxSpeed: number; acceleration: number; friction: number };
        el: {
          sceneEl?: { is: (state: string) => boolean };
          object3D: { position: { x: number; z: number } };
          querySelector: (sel: string) => { object3D: { rotation: { y: number } } } | null;
        };
        keys: Record<string, boolean>;
        velX: number;
        velZ: number;
        onKeyDown: (e: KeyboardEvent) => void;
        onKeyUp: (e: KeyboardEvent) => void;
      };
      self.keys = {};
      self.velX = 0;
      self.velZ = 0;
      self.onKeyDown = (e: KeyboardEvent) => {
        if (!shouldCaptureDesktopKeys(e)) return;
        const code = e.code;
        if (code && DESKTOP_MOVE_KEYS.has(code)) {
          self.keys[code] = true;
        }
      };
      self.onKeyUp = (e: KeyboardEvent) => {
        const code = e.code;
        if (code && DESKTOP_MOVE_KEYS.has(code)) {
          delete self.keys[code];
        }
      };
      window.addEventListener("keydown", self.onKeyDown);
      window.addEventListener("keyup", self.onKeyUp);
    },
    tick(_time: number, dt: number) {
      const self = this as {
        data: { enabled: boolean; maxSpeed: number; acceleration: number; friction: number };
        el: {
          sceneEl?: { is: (state: string) => boolean };
          object3D: { position: { x: number; z: number } };
          querySelector: (sel: string) => { object3D: { rotation: { y: number } } } | null;
        };
        keys: Record<string, boolean>;
        velX: number;
        velZ: number;
      };
      if (!self.data.enabled) {
        self.velX = 0;
        self.velZ = 0;
        return;
      }
      const sceneEl = self.el.sceneEl;
      if (!sceneEl || sceneEl.is("vr-mode")) {
        self.velX = 0;
        self.velZ = 0;
        return;
      }
      const cam = self.el.querySelector("[camera]");
      if (!cam) return;

      const secs = Math.min(dt / 1000, 0.08);
      const yaw = cam.object3D.rotation.y;
      const sin = Math.sin(yaw);
      const cos = Math.cos(yaw);
      const forwardX = sin;
      const forwardZ = -cos;
      const rightX = cos;
      const rightZ = sin;

      const k = self.keys;
      let ix = 0;
      let iz = 0;
      if (k.KeyW || k.ArrowUp) {
        ix += forwardX;
        iz += forwardZ;
      }
      if (k.KeyS || k.ArrowDown) {
        ix -= forwardX;
        iz -= forwardZ;
      }
      if (k.KeyD || k.ArrowRight) {
        ix += rightX;
        iz += rightZ;
      }
      if (k.KeyA || k.ArrowLeft) {
        ix -= rightX;
        iz -= rightZ;
      }

      const mag = Math.hypot(ix, iz);
      const { maxSpeed, acceleration, friction } = self.data;

      if (mag < 1e-6) {
        const decay = Math.exp(-friction * secs);
        self.velX *= decay;
        self.velZ *= decay;
        if (Math.hypot(self.velX, self.velZ) < 1e-5) {
          self.velX = 0;
          self.velZ = 0;
        }
      } else {
        const nx = ix / mag;
        const nz = iz / mag;
        self.velX += nx * acceleration * secs;
        self.velZ += nz * acceleration * secs;
        const sp = Math.hypot(self.velX, self.velZ);
        if (sp > maxSpeed) {
          self.velX = (self.velX / sp) * maxSpeed;
          self.velZ = (self.velZ / sp) * maxSpeed;
        }
      }

      self.el.object3D.position.x += self.velX * secs;
      self.el.object3D.position.z += self.velZ * secs;
    },
    remove() {
      const self = this as { onKeyDown: (e: KeyboardEvent) => void; onKeyUp: (e: KeyboardEvent) => void };
      window.removeEventListener("keydown", self.onKeyDown);
      window.removeEventListener("keyup", self.onKeyUp);
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
