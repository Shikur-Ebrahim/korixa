import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import type {
  ExtractedIdData,
  KycStatus,
  KycSubmissionPayload,
  UserKycRecord,
} from "@/lib/kyc/types";
import { evaluateKycSubmission } from "@/lib/kyc/types";

const USERS_COLLECTION = "users";

function docToRecord(userId: string, data: FirebaseFirestore.DocumentData): UserKycRecord {
  return {
    userId,
    email: data.email ?? "",
    kycStatus: data.kycStatus ?? "pending",
    idImageUrl: data.idImageUrl ?? null,
    selfieImageUrl: data.selfieImageUrl ?? null,
    extractedIdData: data.extractedIdData ?? null,
    faceMatchScore: data.faceMatchScore ?? null,
    faceMatchDistance: data.faceMatchDistance ?? null,
    livenessPassed: Boolean(data.livenessPassed),
    rejectionReason: data.rejectionReason ?? null,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? "",
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? data.updatedAt ?? "",
  };
}

export async function getUserKycRecord(userId: string): Promise<UserKycRecord | null> {
  const snapshot = await adminDb.collection(USERS_COLLECTION).doc(userId).get();

  if (!snapshot.exists) {
    return null;
  }

  return docToRecord(userId, snapshot.data()!);
}

export async function ensureUserRecord(
  userId: string,
  email: string
): Promise<UserKycRecord> {
  const ref = adminDb.collection(USERS_COLLECTION).doc(userId);
  const snapshot = await ref.get();

  if (snapshot.exists) {
    return docToRecord(userId, snapshot.data()!);
  }

  const now = FieldValue.serverTimestamp();
  await ref.set({
    userId,
    email,
    kycStatus: "pending",
    idImageUrl: null,
    selfieImageUrl: null,
    extractedIdData: null,
    faceMatchScore: null,
    faceMatchDistance: null,
    livenessPassed: false,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now,
  });

  const created = await ref.get();
  return docToRecord(userId, created.data()!);
}

export async function submitUserKyc(
  userId: string,
  email: string,
  payload: KycSubmissionPayload
): Promise<UserKycRecord> {
  const evaluation = evaluateKycSubmission(payload);

  const ref = adminDb.collection(USERS_COLLECTION).doc(userId);
  const now = FieldValue.serverTimestamp();

  const update = {
    userId,
    email,
    kycStatus: evaluation.status as KycStatus,
    idImageUrl: payload.idImageUrl,
    selfieImageUrl: payload.selfieImageUrl,
    extractedIdData: payload.extractedIdData as ExtractedIdData,
    faceMatchScore: payload.faceMatchScore,
    faceMatchDistance: payload.faceMatchDistance,
    livenessPassed: payload.livenessPassed,
    rejectionReason: evaluation.rejectionReason,
    updatedAt: now,
  };

  const existing = await ref.get();

  if (existing.exists) {
    await ref.update(update);
  } else {
    await ref.set({
      ...update,
      createdAt: now,
    });
  }

  const saved = await ref.get();
  return docToRecord(userId, saved.data()!);
}
