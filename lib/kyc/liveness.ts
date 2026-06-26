"use client";

export type LivenessChallenge = "face-present" | "blink-once" | "turn-head" | "smile";

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
    instruction: "Look at the camera",
    retryInstruction: "Look at the camera and keep your face in the frame.",
  },
  {
    id: "blink-once",
    label: "Blink once",
    hint: "Blink your eyes once",
    instruction: "Blink once",
    retryInstruction: "Close and open your eyes once.",
  },
  {
    id: "turn-head",
    label: "Turn head left or right",
    hint: "Turn your head slightly left or right",
    instruction: "Turn your head left or right",
    retryInstruction: "Turn your head a little to the left or right.",
  },
  {
    id: "smile",
    label: "Smile",
    hint: "Show a small smile",
    instruction: "Smile",
    retryInstruction: "Give a small smile for the camera.",
  },
];

export const LIVENESS_RETRY_MS = 3000;

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
  // 0.85 relative threshold (easier than 0.78) + absolute 0.20 fallback for dim lighting / dark skin
  return ear < baselineEar * 0.85 || ear < 0.20;
}

export function isHeadTurned(yaw: number): boolean {
  // Fast acceptance: slightly left or right
  return yaw < -0.05 || yaw > 0.05;
}

export function isFaceCentered(yaw: number): boolean {
  return Math.abs(yaw) < 0.12;
}

export function isFacePresent(_yaw: number): boolean {
  return true;
}

export function isSmiling(landmarks: { x: number; y: number }[]): boolean {
  const leftCorner = landmarks[48];
  const rightCorner = landmarks[54];
  const topLip = landmarks[51];
  const bottomLip = landmarks[57];

  if (!leftCorner || !rightCorner || !topLip || !bottomLip) {
    return false;
  }

  // Vertical mouth height only (old code used hypot with X included — inflated height, broke ratio)
  const mouthHeight = Math.abs(bottomLip.y - topLip.y) || 1;
  const mouthWidth = Math.hypot(leftCorner.x - rightCorner.x, leftCorner.y - rightCorner.y);
  const lipCenterY = (topLip.y + bottomLip.y) / 2;

  // Ratio lowered 1.5 → 1.2 (easier smile); corner tolerance raised 2px → 10px
  return (
    mouthWidth / mouthHeight > 1.2 &&
    leftCorner.y <= lipCenterY + 10 &&
    rightCorner.y <= lipCenterY + 10
  );
}

/** Tracks open → closed → open cycles for blink detection */
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
        baselineEar = baselineEar * 0.85 + ear * 0.15;
      }

      return { blinkCount, complete: blinkCount >= 1 };
    },
  };
}
