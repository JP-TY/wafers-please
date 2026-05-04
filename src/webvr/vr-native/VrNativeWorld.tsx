"use client";

import { createElement as h } from "react";
import { VrDebriefBoard } from "@/webvr/vr-native/VrDebriefBoard";
import { VrInspectionWorldPanel } from "@/webvr/vr-native/VrInspectionWorldPanel";

/** In-scene UI for WebXR (no DOM overlay). Tutorial is camera-mounted (`VrTutorialHud`). */
export function VrNativeWorld() {
  return h("a-entity", { "data-vr-native-world": "1" }, [
    h(VrInspectionWorldPanel, { key: "insp" }),
    h(VrDebriefBoard, { key: "deb" })
  ]);
}
