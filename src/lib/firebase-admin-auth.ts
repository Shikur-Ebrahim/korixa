import { getAuth, type Auth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase-admin";

let adminAuthInstance: Auth | undefined;

/**
 * Firebase Admin Auth — only import this from verify-otp / protected API routes.
 * Loads jwks-rsa/jose; keep out of send-otp and health Firestore-only paths.
 */
export function getAdminAuth(): Auth {
  if (!adminAuthInstance) {
    adminAuthInstance = getAuth(getAdminApp());
  }
  return adminAuthInstance;
}
