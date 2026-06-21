"use client";

import { FACE_DETECTOR_OPTIONS, loadFaceApiModels } from "@/lib/kyc/face-api-loader";
import { faceDistanceToScore } from "@/lib/kyc/types";

export type FaceMatchResult = {
  distance: number;
  score: number;
  matched: boolean;
};

async function getFaceDescriptor(imageSource: string): Promise<Float32Array> {
  const faceapi = await loadFaceApiModels();
  const input = await faceapi.fetchImage(imageSource);
  const detection = await faceapi
    .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions(FACE_DETECTOR_OPTIONS))
    .withFaceLandmarks(true)
    .withFaceDescriptor();

  if (!detection) {
    throw new Error("No face detected in image.");
  }

  return detection.descriptor;
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

  const distance = faceapi.euclideanDistance(idDescriptor, selfieDescriptor);
  const score = faceDistanceToScore(distance);

  return {
    distance,
    score,
    matched: distance <= 0.6,
  };
}
