import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  type Auth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let persistencePromise: Promise<void> | null = null;

function getFirebaseApp(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Firebase client SDK must only be used in the browser.");
  }

  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }

  return app;
}

function ensurePersistence(clientAuth: Auth): Promise<void> {
  if (!persistencePromise) {
    persistencePromise = setPersistence(clientAuth, browserLocalPersistence).catch(() => {
      /* fallback — auth still works for current tab session */
    });
  }

  return persistencePromise;
}

/** Client-side Firebase Auth — browser only */
export function getClientAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
    void ensurePersistence(auth);
  }

  return auth;
}

/** Wait for auth persistence before reading session (prevents false logouts on refresh) */
export async function initClientAuth(): Promise<Auth> {
  const clientAuth = getClientAuth();
  await ensurePersistence(clientAuth);
  return clientAuth;
}
