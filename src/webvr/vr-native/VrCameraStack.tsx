"use client";

import { Fragment, createElement as h } from "react";
import { VrCameraHud } from "@/webvr/vr-native/VrCameraHud";
import { VrFixMiniGameCamera } from "@/webvr/vr-native/VrFixMiniGameCamera";
import { VrInspectionCameraTablet } from "@/webvr/vr-native/VrInspectionCameraTablet";
import { VrInspectionQuiz } from "@/webvr/vr-native/VrInspectionQuiz";
import { VrTutorialHud } from "@/webvr/vr-native/VrTutorialHud";

/** Camera-attached UI stack: HUD → inspection → quiz → fix game → tutorial. */
export function VrCameraStack() {
  return h(Fragment, {}, [
    h(VrCameraHud, { key: "hud" }),
    h(VrInspectionCameraTablet, { key: "insp-tab" }),
    h(VrInspectionQuiz, { key: "insp-quiz" }),
    h(VrFixMiniGameCamera, { key: "fix" }),
    h(VrTutorialHud, { key: "tut" })
  ]);
}
