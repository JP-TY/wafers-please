"use client";

import { createElement as h } from "react";
import type { CueType } from "@/ui/audio/useUiAudio";
import { truncateForVrText } from "@/webvr/vr-native/vr-text-utils";
import { VR_BUTTON_MIN_HEIGHT, VR_BUTTON_MIN_WIDTH, VR_HIT_CLASSES } from "@/webvr/vr-native/vr-layout-constants";

/** Camera-mounted button with a forward hit slab so lasers prefer UI over world geometry. */
export function vrCamTactileButton(args: {
  key: string;
  label: string;
  position: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  width?: number;
  playCue: (c: CueType) => void;
  cue?: CueType;
  /** Longer body copy for quiz rows (default 44). */
  labelMaxChars?: number;
}) {
  const cue = args.cue ?? "soft";
  const w = args.width ?? VR_BUTTON_MIN_WIDTH;
  const hitW = w + 0.06;
  const hitH = Math.max(VR_BUTTON_MIN_HEIGHT, 0.1);
  const visH = Math.max(0.07, hitH - 0.03);
  const maxChars = args.labelMaxChars ?? 44;
  const fire = () => {
    if (args.disabled || !args.onClick) return;
    args.playCue(cue);
    args.onClick();
  };
  const hitClass = args.disabled || !args.onClick ? "" : VR_HIT_CLASSES;
  return h(
    "a-entity",
    { key: args.key, position: args.position },
    [
      h("a-box", {
        key: "hit",
        position: "0 0 0.004",
        width: hitW,
        height: hitH,
        depth: 0.028,
        class: hitClass,
        material: "opacity: 0.06; transparent: true; side: double; depthTest: true; depthWrite: false",
        onClick: fire
      }),
      h("a-box", {
        key: "vis",
        position: "0 0 0.022",
        width: w,
        height: visH,
        depth: 0.02,
        color: args.disabled ? "#2a3340" : args.active ? "#2d7fd1" : "#2a4153",
        opacity: args.disabled ? 0.45 : 1,
        material: "depthTest: true"
      }),
      h("a-text", {
        key: "tx",
        value: truncateForVrText(args.label, maxChars),
        width: 1.15,
        align: "center",
        position: "0 0 0.034",
        color: "#f0f8ff"
      })
    ]
  );
}
