export type KycStatus = "pending" | "verified" | "rejected";

export type ExtractedIdData = {
  name: string | null;
  idNumber: string | null;
  dob: string | null;
  rawText: string;
};

export type UserKycRecord = {
  userId: string;
  email: string;
  fullName: string;
  kycStatus: KycStatus;
  idImageUrl: string | null;
  selfieImageUrl: string | null;
  extractedIdData: ExtractedIdData | null;
  faceMatchScore: number | null;
  faceMatchDistance: number | null;
  livenessPassed: boolean;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type KycSubmissionPayload = {
  fullName: string;
  idImageUrl: string;
  selfieImageUrl: string;
  extractedIdData: ExtractedIdData;
  faceMatchDistance: number;
  faceMatchScore: number;
  livenessPassed: boolean;
};

/** face-api.js euclidean distance — lower is a better match */
export const FACE_MATCH_MAX_DISTANCE = 0.6;

export function faceDistanceToScore(distance: number): number {
  return Math.max(0, Math.min(100, Math.round((1 - distance) * 100)));
}

export function evaluateKycSubmission(payload: KycSubmissionPayload): {
  status: KycStatus;
  rejectionReason: string | null;
} {
  if (!payload.livenessPassed) {
    return { status: "rejected", rejectionReason: "Liveness check failed." };
  }

  if (payload.faceMatchDistance > FACE_MATCH_MAX_DISTANCE) {
    return {
      status: "rejected",
      rejectionReason: "Selfie does not match the ID photo.",
    };
  }

  const hasIdSignal =
    Boolean(payload.extractedIdData.idNumber) ||
    Boolean(payload.extractedIdData.name) ||
    payload.extractedIdData.rawText.trim().length > 20;

  if (!hasIdSignal) {
    return {
      status: "rejected",
      rejectionReason: "Could not read ID document. Upload a clearer photo.",
    };
  }

  return { status: "verified", rejectionReason: null };
}
