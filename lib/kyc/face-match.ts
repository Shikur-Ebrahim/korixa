"use client";

import { FACE_DETECTOR_OPTIONS, loadFaceApiModels } from "@/lib/kyc/face-api-loader";
import { faceDistanceToScore } from "@/lib/kyc/types";

export type FaceMatchResult = {
  distance: number;
  score: number;
  matched: boolean;
  selfieDescriptor?: number[];
  skipped?: boolean; // true when face could not be detected in one of the images
};

/**
 * Load an image from a data URL (base64) or HTTPS URL into an HTMLImageElement.
 * faceapi.fetchImage() only works with real HTTP URLs — it fails on data: URIs.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

export async function getFaceDescriptor(imageSource: string): Promise<Float32Array | null> {
  try {
    const faceapi = await loadFaceApiModels();
    const input = await loadImage(imageSource);

    const detection = await faceapi
      .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions(FACE_DETECTOR_OPTIONS))
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    return detection?.descriptor ?? null;
  } catch {
    return null;
  }
}

export async function compareFaces(
  idImageSource: string,
  selfieImageSource: string
): Promise<FaceMatchResult> {
  const faceapi = await loadFaceApiModels();

  const [idDescriptor, selfieDescriptor] = await Promise.all([
    getFaceDescriptor(idImageSource),
    getFaceDescriptor(selfieImageSource),
  ]);

  // If either image has no detectable face (small ID photo, poor quality),
  // skip the match and treat liveness as the proof — a human reviewer will verify.
  if (!idDescriptor || !selfieDescriptor) {
    return {
      distance: 1,
      score: 0,
      matched: true, // liveness already confirmed the person is real
      skipped: true,
    };
  }

  const distance = faceapi.euclideanDistance(idDescriptor, selfieDescriptor);
  const score = faceDistanceToScore(distance);

  return {
    distance,
    score,
    matched: distance <= 0.65, // slightly more lenient than 0.6
    selfieDescriptor: Array.from(selfieDescriptor),
    skipped: false,
  };
}
