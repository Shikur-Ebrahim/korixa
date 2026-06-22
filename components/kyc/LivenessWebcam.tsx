"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FACE_DETECTOR_OPTIONS, loadFaceApiModels } from "@/lib/kyc/face-api-loader";
import {
  createBlinkTracker,
  eyeAspectRatio,
  headYawFromLandmarks,
  isFacePresent,
  isHeadTurnLeft,
  isSmiling,
  LIVENESS_CHALLENGES,
  LIVENESS_RETRY_MS,
  type LivenessChallenge,
} from "@/lib/kyc/liveness";
import { speakInstruction, stopSpeaking } from "@/lib/kyc/speech";
import { canvasToDataUrl } from "@/lib/kyc/upload";
import { appTheme } from "@/components/layout/app-theme";

type LivenessWebcamProps = {
  onCapture: (selfieDataUrl: string) => void;
  disabled?: boolean;
};

type AssistantPhase = "starting" | "guiding" | "capturing" | "done";

export function LivenessWebcam({ onCapture, disabled = false }: LivenessWebcamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const blinkTrackerRef = useRef(createBlinkTracker());
  const stepRef = useRef(0);
  const completedRef = useRef<Record<LivenessChallenge, boolean>>({
    "face-present": false,
    "blink-once": false,
    "turn-left": false,
    smile: false,
  });
  const lastSpokenRef = useRef(0);
  const capturingRef = useRef(false);
  const advancingRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [phase, setPhase] = useState<AssistantPhase>("starting");
  const [completed, setCompleted] = useState<Record<LivenessChallenge, boolean>>({
    "face-present": false,
    "blink-once": false,
    "turn-left": false,
    smile: false,
  });
  const [statusText, setStatusText] = useState("Starting AI liveness assistant...");
  const [assistantLine, setAssistantLine] = useState("Preparing camera and voice guide...");

  const challenge = LIVENESS_CHALLENGES[currentStep];
  const allDone = LIVENESS_CHALLENGES.every((item) => completed[item.id]);

  const syncStep = useCallback((step: number) => {
    stepRef.current = step;
    setCurrentStep(step);
  }, []);

  const markComplete = useCallback((id: LivenessChallenge) => {
    if (completedRef.current[id]) return;

    completedRef.current = { ...completedRef.current, [id]: true };
    setCompleted((prev) => ({ ...prev, [id]: true }));
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const captureSelfie = useCallback(() => {
    const video = videoRef.current;

    if (!video || capturingRef.current) return;

    capturingRef.current = true;
    setPhase("capturing");
    setStatusText("Capturing your selfie...");
    setAssistantLine("Perfect! Hold still while I capture your photo.");

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      capturingRef.current = false;
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    stopCamera();
    stopSpeaking();
    setPhase("done");
    onCapture(canvasToDataUrl(canvas));
  }, [onCapture, stopCamera]);

  const advanceStep = useCallback(
    async (fromStep: number) => {
      if (advancingRef.current || capturingRef.current) return;
      advancingRef.current = true;

      try {
        if (fromStep >= LIVENESS_CHALLENGES.length - 1) {
          void speakInstruction("Great! Hold still.");
          window.setTimeout(() => captureSelfie(), 350);
          return;
        }

        const next = fromStep + 1;
        syncStep(next);

        if (LIVENESS_CHALLENGES[next]?.id === "blink-once") {
          blinkTrackerRef.current.reset();
        }

        const nextChallenge = LIVENESS_CHALLENGES[next];
        if (nextChallenge) {
          setAssistantLine(nextChallenge.instruction);
          setStatusText(nextChallenge.hint);
          lastSpokenRef.current = Date.now();
          void speakInstruction(nextChallenge.instruction);
        }
      } finally {
        advancingRef.current = false;
      }
    },
    [captureSelfie, syncStep]
  );

  const repeatInstruction = useCallback(async (step: number) => {
    const item = LIVENESS_CHALLENGES[step];
    if (!item) return;

    setAssistantLine(item.retryInstruction);
    lastSpokenRef.current = Date.now();
    await speakInstruction(item.retryInstruction);
  }, []);

  const detectLoop = useCallback(async () => {
    const video = videoRef.current;

    if (!video || video.readyState < 2 || capturingRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        void detectLoop();
      });
      return;
    }

    const activeStep = stepRef.current;
    const active = LIVENESS_CHALLENGES[activeStep];

    if (!active || completedRef.current[active.id]) {
      rafRef.current = requestAnimationFrame(() => {
        void detectLoop();
      });
      return;
    }

    try {
      const faceapi = await loadFaceApiModels();
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions(FACE_DETECTOR_OPTIONS))
        .withFaceLandmarks(true);

      const now = Date.now();
      const shouldRetry = now - lastSpokenRef.current > LIVENESS_RETRY_MS;

      if (!detection) {
        setStatusText("No face detected — move closer to the camera");
        if (shouldRetry) {
          void repeatInstruction(activeStep);
        }
      } else {
        const landmarks = detection.landmarks.positions.map((p) => ({ x: p.x, y: p.y }));
        const leftEye = landmarks.slice(36, 42);
        const rightEye = landmarks.slice(42, 48);
        const ear = eyeAspectRatio(leftEye, rightEye);
        const yaw = headYawFromLandmarks(landmarks);

        if (active.id === "face-present" && isFacePresent(yaw)) {
          markComplete("face-present");
          setStatusText("Face detected ✓");
          void advanceStep(activeStep);
        } else if (active.id === "blink-once") {
          const { complete } = blinkTrackerRef.current.update(ear);
          setStatusText(complete ? "Blink detected ✓" : "Blink once");

          if (complete) {
            markComplete("blink-once");
            void advanceStep(activeStep);
          } else if (shouldRetry) {
            void repeatInstruction(activeStep);
          }
        } else if (active.id === "turn-left" && isHeadTurnLeft(yaw)) {
          markComplete("turn-left");
          setStatusText("Head turn left ✓");
          void advanceStep(activeStep);
        } else if (active.id === "smile" && isSmiling(landmarks)) {
          markComplete("smile");
          setStatusText("Smile detected ✓");
          void advanceStep(activeStep);
        } else if (shouldRetry) {
          void repeatInstruction(activeStep);
        } else {
          setStatusText(active.hint);
        }
      }
    } catch {
      setStatusText("Face detection running...");
    }

    rafRef.current = requestAnimationFrame(() => {
      void detectLoop();
    });
  }, [advanceStep, markComplete, repeatInstruction]);

  useEffect(() => {
    if (disabled) return;

    let mounted = true;

    async function start() {
      try {
        if (typeof window !== "undefined" && window.speechSynthesis) {
          window.speechSynthesis.getVoices();
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        await loadFaceApiModels();
        setReady(true);
        setPhase("guiding");

        const first = LIVENESS_CHALLENGES[0];
        setAssistantLine(first.instruction);
        setStatusText(first.hint);
        lastSpokenRef.current = Date.now();
        void speakInstruction(first.instruction);

        rafRef.current = requestAnimationFrame(() => {
          void detectLoop();
        });
      } catch {
        setError("Camera access denied. Allow camera permission to continue.");
      }
    }

    void start();

    return () => {
      mounted = false;
      stopSpeaking();
      stopCamera();
    };
  }, [detectLoop, disabled, stopCamera]);

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      ) : (
        <>
          <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              AI Liveness Assistant
            </p>
            <p className="mt-1 text-sm font-medium text-white">{assistantLine}</p>
            <p className="mt-1 text-xs text-[#848e9c]">{statusText}</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0b0e11]">
            <video ref={videoRef} className="aspect-[4/3] w-full object-cover" muted playsInline />
          </div>

          <div className={`${appTheme.card}`}>
            <p className="mb-2 text-sm font-medium text-white">
              {challenge?.label ?? "Verification complete"}
            </p>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LIVENESS_CHALLENGES.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg px-2 py-2 text-center text-[11px] ${
                    completed[item.id]
                      ? "border border-secondary/30 bg-secondary/10 text-secondary"
                      : item.id === challenge?.id
                        ? "border border-primary/30 bg-primary/10 text-primary"
                        : "border border-white/[0.06] bg-[#0b0e11] text-[#848e9c]"
                  }`}
                >
                  {completed[item.id] ? "✓ " : ""}
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#161a1e] px-4 py-3 text-center text-xs text-[#848e9c]">
            {!ready && "Initializing webcam..."}
            {ready && phase === "guiding" && !allDone && "Follow the voice instructions. Actions repeat if not detected."}
            {ready && allDone && phase === "capturing" && "Capturing selfie automatically..."}
            {phase === "done" && "Selfie captured."}
          </div>
        </>
      )}
    </div>
  );
}
