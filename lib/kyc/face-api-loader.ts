"use client";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model";

let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

export async function loadFaceApiModels(): Promise<typeof import("@vladmandic/face-api")> {
  const faceapi = await import("@vladmandic/face-api");

  if (modelsLoaded) {
    return faceapi;
  }

  if (!loadingPromise) {
    loadingPromise = (async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      modelsLoaded = true;
    })();
  }

  await loadingPromise;
  return faceapi;
}

export const FACE_DETECTOR_OPTIONS = {
  inputSize: 320,   // faster than 416 — processes each frame ~40% quicker
  scoreThreshold: 0.4, // more sensitive face detection in dim / low-contrast light
};
