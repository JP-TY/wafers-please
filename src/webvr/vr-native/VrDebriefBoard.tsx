"use client";

import { createElement as h, useEffect, useState } from "react";
import { buildDebriefCoachingLines, buildDebriefMetricLines } from "@/game/engine/debrief-copy";
import { useGameStore } from "@/game/store/game-store";
import { useUiAudio } from "@/ui/audio/useUiAudio";
import { VR_HIT_CLASSES } from "@/webvr/vr-native/vr-layout-constants";
import { truncateForVrText } from "@/webvr/vr-native/vr-text-utils";

export function VrDebriefBoard() {
  const { playCue } = useUiAudio();
  const result = useGameStore((s) => s.result);
  const currentDay = useGameStore((s) => s.currentDay);
  const currentRules = useGameStore((s) => s.currentRules);
  const advanceToNextDay = useGameStore((s) => s.advanceToNextDay);
  const resetShift = useGameStore((s) => s.resetShift);

  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [result]);

  if (!result) return null;

  const metricLines = buildDebriefMetricLines(result, currentRules, currentDay);
  const coachingLines = buildDebriefCoachingLines(result, currentRules);
  const metricsText = metricLines.join("\n");
  const coachingText = ["Coaching:", ...coachingLines.map((c) => `• ${c}`)].join("\n");
  const pages = [metricsText, truncateForVrText(coachingText, 900)];
  const canAdvanceDay = currentDay < 3;

  return h("a-entity", { position: "0 2.05 -2.05", rotation: "-12 0 0" }, [
    h("a-plane", {
      key: "bg",
      position: "0 0 -0.02",
      width: 1.75,
      height: 1.05,
      color: "#0a1520",
      opacity: 0.96,
      transparent: true,
      shader: "flat"
    }),
    h("a-text", {
      key: "pg",
      position: "0 0.44 0",
      value: `Debrief ${page + 1}/${pages.length}`,
      width: 1.2,
      align: "center",
      color: "#8ec5e8"
    }),
    h("a-text", {
      key: "t",
      position: "0 0.08 0",
      value: truncateForVrText(pages[page] ?? "", 950),
      width: 1.45,
      align: "center",
      color: "#e8f4ff"
    }),
    h("a-entity", { key: "pgnav", position: "0 -0.38 0.02" }, [
      h(
        "a-box",
        {
          key: "pv",
          position: "-0.22 0 0",
          width: 0.18,
          height: 0.055,
          depth: 0.03,
          color: page === 0 ? "#1a2530" : "#2a4153",
          class: page === 0 ? "" : VR_HIT_CLASSES,
          onClick:
            page === 0
              ? undefined
              : () => {
                  playCue("soft");
                  setPage((p) => Math.max(0, p - 1));
                }
        },
        [h("a-text", { value: "Prev", width: 1, align: "center", position: "0 0 0.016", color: "#fff" })]
      ),
      h(
        "a-box",
        {
          key: "pn",
          position: "0.22 0 0",
          width: 0.18,
          height: 0.055,
          depth: 0.03,
          color: page >= pages.length - 1 ? "#1a2530" : "#2a4153",
          class: page >= pages.length - 1 ? "" : VR_HIT_CLASSES,
          onClick:
            page >= pages.length - 1
              ? undefined
              : () => {
                  playCue("soft");
                  setPage((p) => Math.min(pages.length - 1, p + 1));
                }
        },
        [h("a-text", { value: "Next", width: 1, align: "center", position: "0 0 0.016", color: "#fff" })]
      )
    ]),
    h("a-entity", { key: "row", position: "0 -0.52 0.02" }, [
      canAdvanceDay
        ? h(
            "a-box",
            {
              key: "next",
              position: "-0.28 0 0",
              width: 0.42,
              height: 0.07,
              depth: 0.03,
              color: "#2d7fd1",
              class: VR_HIT_CLASSES,
              onClick: () => {
                playCue("confirm");
                advanceToNextDay();
              }
            },
            [
              h("a-text", {
                value: `Continue day ${currentDay + 1}`,
                width: 1.2,
                align: "center",
                position: "0 0 0.016",
                color: "#fff"
              })
            ]
          )
        : null,
      h(
        "a-box",
        {
          key: "rst",
          position: canAdvanceDay ? "0.32 0 0" : "0 0 0",
          width: 0.36,
          height: 0.07,
          depth: 0.03,
          color: "#2a4153",
          class: VR_HIT_CLASSES,
          onClick: () => {
            playCue("soft");
            resetShift();
          }
        },
        [
          h("a-text", {
            value: "Restart D1",
            width: 1,
            align: "center",
            position: "0 0 0.016",
            color: "#fff"
          })
        ]
      )
    ])
  ]);
}
