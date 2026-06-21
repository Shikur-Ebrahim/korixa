"use client";

export type LivenessChallenge = "face-present" | "blink-twice" | "turn-left" | "smile";

export type LivenessChallengeMeta = {
  id: LivenessChallenge;
  label: string;
  hint: string;
  instruction: string;
  retryInstruction: string;
};

export const LIVENESS_CHALLENGES: LivenessChallengeMeta[] = [
  {
    id: "face-present",
    label: "Look at camera",
    hint: "Position your face in the frame",
    instruction: "Please look at the camera",
    retryInstruction: "Please look at the camera. Make sure your face is visible.",
  },
  {
    id: "blink-twice",
    label: "Blink twice",
    hint: "Blink your eyes two times",
    instruction: "Blink your eyes twice",
    retryInstruction: "Blink your eyes twice, slowly.",
  },
  {
    id: "turn-left",
    label: "Turn left",
    hint: "Turn your head slowly to the left",
    instruction: "Turn your head slowly left",
    retryInstruction: "Turn your head slowly to the left.",
  },
  {
    id: "smile",
    label: "Smile",
    hint: "Show a natural smile",
    instruction: "Now smile",
    retryInstruction: "Please smile for the camera.",
  },
];

export const LIVENESS_RETRY_MS = 9000;

/** Eye aspect ratio — lower values indicate a blink */
export function eyeAspectRatio(
  leftEye: { x: number; y: number }[],
  rightEye: { x: number; y: number }[]
): number {
  const ear = (eye: { x: number; y: number }[]) => {
    const verticalA = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
    const verticalB = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
    const horizontal = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);
    return (verticalA + verticalB) / (2 * horizontal);
  };

  return (ear(leftEye) + ear(rightEye)) / 2;
}

export function headYawFromLandmarks(
  landmarks: { x: number; y: number }[]
): number {
  const nose = landmarks[30];
  const leftCheek = landmarks[3];
  const rightCheek = landmarks[13];
  const faceCenterX = (leftCheek.x + rightCheek.x) / 2;
  const faceWidth = Math.abs(rightCheek.x - leftCheek.x) || 1;

  return (nose.x - faceCenterX) / faceWidth;
}

export function isBlinkDetected(ear: number, baselineEar: number): boolean {
  return ear < baselineEar * 0.65;
}

export function isHeadTurnLeft(yaw: number): boolean {
  return yaw < -0.12;
}

export function isHeadTurnRight(yaw: number): boolean {
  return yaw > 0.12;
}

export function isFaceCentered(yaw: number): boolean {
  return Math.abs(yaw) < 0.08;
}

export function isFacePresent(yaw: number): boolean {
  return Math.abs(yaw) < 0.18;
}

export function isSmiling(landmarks: { x: number; y: number }[]): boolean {
  const leftCorner = landmarks[48];
  const rightCorner = landmarks[54];
  const topLip = landmarks[51];
  const bottomLip = landmarks[57];

  if (!leftCorner || !rightCorner || !topLip || !bottomLip) {
    return false;
  }

  const mouthHeight = Math.hypot(topLip.x - bottomLip.x, topLip.y - bottomLip.y);
  const mouthWidth = Math.hypot(leftCorner.x - rightCorner.x, leftCorner.y - rightCorner.y);
  const lipCenterY = (topLip.y + bottomLip.y) / 2;

  return mouthWidth / (mouthHeight || 1) > 2.4 && leftCorner.y < lipCenterY && rightCorner.y < lipCenterY;
}

/** Tracks open → closed → open cycles for double-blink detection */
export function createBlinkTracker() {
  let baselineEar: number | null = null;
  let eyesClosed = false;
  let blinkCount = 0;

  return {
    reset() {
      baselineEar = null;
      eyesClosed = false;
      blinkCount = 0;
    },
    update(ear: number) {
      if (baselineEar === null) {
        baselineEar = ear;
        return { blinkCount, complete: false };
      }

      const closed = isBlinkDetected(ear, baselineEar);

      if (closed && !eyesClosed) {
        eyesClosed = true;
      } else if (!closed && eyesClosed) {
        eyesClosed = false;
        blinkCount += 1;
        baselineEar = ear;
      } else if (!closed) {
        baselineEar = baselineEar * 0.9 + ear * 0.1;
      }

      return { blinkCount, complete: blinkCount >= 2 };
    },
  };
}
