import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function getPrivateKey(): string {
  let key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) {
    throw new Error("FIREBASE_PRIVATE_KEY is not configured.");
  }

  key = key.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  return key.replace(/\\n/g, "\n");
}

function getClientEmail(): string {
  let email = (process.env.FIREBASE_CLIENT_EMAIL ?? "").trim();
  const markdownMatch = email.match(/^\[([^\]]+)\]\([^)]+\)$/);
  if (markdownMatch) {
    email = markdownMatch[1];
  }
  return email.replace(/^mailto:/i, "").trim();
}

function createAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = getClientEmail();

  if (!projectId || !clientEmail) {
    throw new Error("Firebase Admin credentials are not fully configured.");
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: getPrivateKey(),
    }),
  });
}

let adminApp: App | undefined;
let adminDbInstance: Firestore | undefined;

/** Initialize Firebase Admin app + Firestore only (no auth — avoids jwks-rsa/jose on OTP routes). */
export function ensureAdminApp(): App {
  if (!adminApp) {
    adminApp = createAdminApp();
    adminDbInstance = getFirestore(adminApp);
  }
  return adminApp;
}

export function getAdminApp(): App {
  return ensureAdminApp();
}

/** Server-only Firestore — safe for send-otp and health checks on Vercel. */
export function getAdminDb(): Firestore {
  ensureAdminApp();
  return adminDbInstance!;
}

export default getAdminApp;
