import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
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
    fullName: data.fullName ?? "",
    kycStatus: data.kycStatus ?? "pending",
    idImageUrl: data.idImageUrl ?? null,
    selfieImageUrl: data.selfieImageUrl ?? null,
    extractedIdData: data.extractedIdData ?? null,
    faceMatchScore: data.faceMatchScore ?? null,
    faceMatchDistance: data.faceMatchDistance ?? null,
    faceDescriptor: data.faceDescriptor ?? [],
    livenessPassed: Boolean(data.livenessPassed),
    rejectionReason: data.rejectionReason ?? null,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? "",
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? data.updatedAt ?? "",
  };
}

export async function getUserKycRecord(userId: string): Promise<UserKycRecord | null> {
  const snapshot = await getAdminDb().collection(USERS_COLLECTION).doc(userId).get();

  if (!snapshot.exists) {
    return null;
  }

  return docToRecord(userId, snapshot.data()!);
}

export async function ensureUserRecord(
  userId: string,
  email: string
): Promise<UserKycRecord> {
  const ref = getAdminDb().collection(USERS_COLLECTION).doc(userId);
  const snapshot = await ref.get();

  if (snapshot.exists) {
    return docToRecord(userId, snapshot.data()!);
  }

  const now = FieldValue.serverTimestamp();
  await ref.set({
    userId,
    email,
    fullName: "",
    kycStatus: "pending",
    idImageUrl: null,
    selfieImageUrl: null,
    extractedIdData: null,
    faceMatchScore: null,
    faceMatchDistance: null,
    faceDescriptor: [],
    livenessPassed: false,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now,
  });

  const created = await ref.get();
  return docToRecord(userId, created.data()!);
}

function getEuclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return 1;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }
  return Math.sqrt(sum);
}

export async function submitUserKyc(
  userId: string,
  email: string,
  payload: KycSubmissionPayload
): Promise<UserKycRecord> {
  let evaluation = evaluateKycSubmission(payload);

  if (evaluation.status === "pending" && payload.faceDescriptor && payload.faceDescriptor.length > 0) {
    const snapshot = await getAdminDb().collection(USERS_COLLECTION).get();
    for (const doc of snapshot.docs) {
      if (doc.id === userId) continue;
      const data = doc.data();
      if (data.faceDescriptor && Array.isArray(data.faceDescriptor) && data.faceDescriptor.length > 0) {
        const dist = getEuclideanDistance(payload.faceDescriptor, data.faceDescriptor);
        if (dist < 0.55) {
          evaluation = {
            status: "rejected",
            rejectionReason: "This face has already been used in another account.",
          };
          break;
        }
      }
    }
  }

  const ref = getAdminDb().collection(USERS_COLLECTION).doc(userId);
  const now = FieldValue.serverTimestamp();

  const update = {
    userId,
    email,
    fullName: payload.fullName,
    kycStatus: evaluation.status as KycStatus,
    idImageUrl: payload.idImageUrl,
    selfieImageUrl: payload.selfieImageUrl,
    extractedIdData: payload.extractedIdData as ExtractedIdData,
    faceMatchScore: payload.faceMatchScore,
    faceMatchDistance: payload.faceMatchDistance,
    faceDescriptor: payload.faceDescriptor ?? [],
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
