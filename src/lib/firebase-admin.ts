import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function getPrivateKey(): string {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) {
    throw new Error("FIREBASE_PRIVATE_KEY is not configured.");
  }
  return key.replace(/\\n/g, "\n");
}

function getClientEmail(): string {
  const email = process.env.FIREBASE_CLIENT_EMAIL ?? "";
  // Strip markdown link formatting if present in .env
  return email.replace(/^\[/, "").replace(/\]\(.*\)$/, "").trim();
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

const adminApp = createAdminApp();

/** Server-only Firebase Admin Auth */
export const adminAuth: Auth = getAuth(adminApp);

/** Server-only Firestore */
export const adminDb: Firestore = getFirestore(adminApp);

export default adminApp;
