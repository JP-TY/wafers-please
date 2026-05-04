"use client";

import { createElement as h, useEffect, useState } from "react";
import { evaluateFixQuizSubmission, type FixQuizAnswers } from "@/game/engine/fix-quiz-option-sets";
import { useUiAudio } from "@/ui/audio/useUiAudio";
import { CAM_UI_TABLET_POSITION, CAM_UI_TABLET_ROTATION, CAM_UI_TABLET_SCALE } from "@/webvr/vr-native/vr-layout-constants";
import { vrCamTactileButton } from "@/webvr/vr-native/vr-cam-tactile-button";
import { truncateForVrText } from "@/webvr/vr-native/vr-text-utils";
import { useVrInspectionBenchShared } from "@/webvr/vr-native/use-vr-inspection-bench-shared";

/** Camera-mounted fix verification quiz — vertical full-width options. */
export function VrInspectionQuiz() {
  const { playCue } = useUiAudio();
  const b = useVrInspectionBenchShared();
  const [quizAnswers, setQuizAnswers] = useState<FixQuizAnswers>({
    tool: null,
    mechanism: null,
    sequence: null,
    release: null
  });
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizStep, setQuizStep] = useState(0);

  useEffect(() => {
    if (b.fixPhase === "quiz") {
      setQuizAnswers({ tool: null, mechanism: null, sequence: null, release: null });
      setQuizError(null);
      setQuizStep(0);
    }
  }, [b.fixPhase, b.wafer.id]);

  if (!b.isOpen || b.fixPhase !== "quiz") return null;

  const submitFixQuiz = () => {
    const { isCorrect, score, misses } = evaluateFixQuizSubmission({
      quizAnswers,
      mechanismOptions: b.mechanismOptions,
      sequenceOptions: b.sequenceOptions,
      releaseOptions: b.releaseOptions,
      requiredFixTool: b.requiredFixTool
    });
    b.submitFixQuizAttempt(isCorrect);
    if (!isCorrect) {
      playCue("warn");
      setQuizError(`Score ${score}/4. ${misses.join(" ")}`);
      return;
    }
    if (quizAnswers.tool) {
      b.setSelectedFixTool(quizAnswers.tool);
    }
    setQuizError(null);
    playCue("confirm");
    b.startFixMiniGame();
  };

  const rowGap = 0.11;
  const optBaseY = 0.12;

  const verticalOptions = (opts: { id: string; label: string }[], letterStart: number, field: keyof FixQuizAnswers) =>
    opts.map((opt, i) =>
      vrCamTactileButton({
        key: opt.id,
        label: `${String.fromCharCode(letterStart + i)}. ${opt.label}`,
        position: `0 ${optBaseY - i * rowGap} 0.01`,
        width: 0.72,
        active: quizAnswers[field] === opt.id,
        playCue,
        labelMaxChars: 120,
        onClick: () => setQuizAnswers((p) => ({ ...p, [field]: opt.id }))
      })
    );

  const quizBody = h("a-entity", { position: "0 0 0.055", key: "quiz" }, [
    h("a-plane", {
      position: "0 0 0",
      width: 0.88,
      height: 0.92,
      color: "#0a121c",
      opacity: 0.97,
      transparent: true,
      shader: "flat"
    }),
    h("a-text", {
      position: "0 0.4 0.01",
      value: `Fix verification (${quizStep + 1}/5)`,
      width: 1.5,
      align: "center",
      color: "#8ec5e8"
    }),
    h("a-text", {
      position: "0 0.34 0.01",
      value: truncateForVrText(
        `Case: ${b.allDefects.map((d) => d.defectClass).join(", ")} | Sev ${b.wafer.severity}/3 | Load ${b.wafer.defectLoad}/5`,
        120
      ),
      width: 1.2,
      align: "center",
      color: "#b8d9f0"
    }),
    quizError
      ? h("a-text", {
          position: "0 -0.4 0.01",
          value: truncateForVrText(quizError, 100),
          width: 1.15,
          align: "center",
          color: "#ff9aa4"
        })
      : null,
    quizStep === 0
      ? h("a-entity", { key: "s0", position: "0 0.22 0" }, [
          h("a-text", { position: "0 0.14 0.01", value: "Pick repair tool", width: 1.3, align: "center", color: "#fff" }),
          ...b.fixToolOptions.map((ft, i) =>
            vrCamTactileButton({
              key: ft,
              label: b.fixToolLabels[ft],
              position: `0 ${0.02 - i * rowGap} 0.01`,
              width: 0.72,
              active: quizAnswers.tool === ft,
              playCue,
              onClick: () => setQuizAnswers((p) => ({ ...p, tool: ft }))
            })
          )
        ])
      : null,
    quizStep === 1
      ? h("a-entity", { key: "s1", position: "0 0.22 0" }, [
          h("a-text", { position: "0 0.14 0.01", value: "Fab risk priority", width: 1.3, align: "center", color: "#fff" }),
          h("a-entity", { position: "0 0 0" }, verticalOptions(b.mechanismOptions, 65, "mechanism"))
        ])
      : null,
    quizStep === 2
      ? h("a-entity", { key: "s2", position: "0 0.22 0" }, [
          h("a-text", { position: "0 0.14 0.01", value: "Process sequence", width: 1.3, align: "center", color: "#fff" }),
          h("a-entity", { position: "0 0 0" }, verticalOptions(b.sequenceOptions, 65, "sequence"))
        ])
      : null,
    quizStep === 3
      ? h("a-entity", { key: "s3", position: "0 0.22 0" }, [
          h("a-text", { position: "0 0.14 0.01", value: "Release rule", width: 1.3, align: "center", color: "#fff" }),
          h("a-entity", { position: "0 0 0" }, verticalOptions(b.releaseOptions, 65, "release"))
        ])
      : null,
    quizStep === 4
      ? h("a-text", {
          key: "s4",
          position: "0 0.05 0.01",
          value: "Submit answers or go back to edit.",
          width: 1.1,
          align: "center",
          color: "#cfefff"
        })
      : null,
    h("a-entity", { position: "0 -0.36 0.01" }, [
      vrCamTactileButton({
        key: "back",
        label: quizStep === 0 ? "Cancel" : "Back",
        position: "-0.28 0 0",
        playCue,
        cue: "soft",
        onClick: () => {
          if (quizStep === 0) {
            playCue("warn");
            b.cancelFixQuiz();
            return;
          }
          setQuizStep((s) => Math.max(0, s - 1));
        }
      }),
      vrCamTactileButton({
        key: "next",
        label: quizStep === 4 ? "Submit" : "Next",
        position: "0.28 0 0",
        playCue,
        cue: quizStep === 4 ? "confirm" : "soft",
        disabled:
          quizStep === 0
            ? !quizAnswers.tool
            : quizStep === 1
              ? !quizAnswers.mechanism
              : quizStep === 2
                ? !quizAnswers.sequence
                : quizStep === 3
                  ? !quizAnswers.release
                  : false,
        onClick: () => {
          if (quizStep < 4) {
            setQuizStep((s) => s + 1);
            return;
          }
          submitFixQuiz();
        }
      })
    ])
  ]);

  return h(
    "a-entity",
    {
      position: CAM_UI_TABLET_POSITION,
      rotation: CAM_UI_TABLET_ROTATION,
      scale: `${CAM_UI_TABLET_SCALE} ${CAM_UI_TABLET_SCALE} ${CAM_UI_TABLET_SCALE}`
    },
    [quizBody]
  );
}
