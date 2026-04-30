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
