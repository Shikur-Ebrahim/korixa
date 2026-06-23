import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, limit, writeBatch } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase";
import type { UserProfile, UserSecurity, UserSettings, UserDevice, LoginLog } from "./types";
import type { User } from "firebase/auth";

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getClientFirestore();
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function initializeUserProfile(user: User): Promise<UserProfile> {
  const db = getClientFirestore();
  
  // Create base documents across all tracking collections
  const batch = writeBatch(db);
  
  const profileRef = doc(db, "users", user.uid);
  const newProfile: UserProfile = {
    uid: user.uid,
    email: user.email ?? "",
    fullName: user.displayName ?? "",
    username: user.email?.split("@")[0] ?? "User",
    profileImage: user.photoURL ?? null,
    country: null,
    phoneNumber: user.phoneNumber ?? null,
    kycStatus: "unverified",
    vipLevel: 0,
    referralCode: user.uid.substring(0, 8).toUpperCase(),
    createdAt: user.metadata.creationTime ?? new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    accountStatus: "active",
    securityScore: 20, // Baseline for email verified
  };
  batch.set(profileRef, newProfile);

  const securityRef = doc(db, "security", user.uid);
  const newSecurity: UserSecurity = {
    uid: user.uid,
    emailVerified: user.emailVerified,
    phoneVerified: !!user.phoneNumber,
    mfaEnabled: false,
    antiPhishingCode: null,
    withdrawalWhitelistEnabled: false,
    withdrawalWhitelist: [],
  };
  batch.set(securityRef, newSecurity);

  const settingsRef = doc(db, "settings", user.uid);
  const newSettings: UserSettings = {
    uid: user.uid,
    language: "en",
    theme: "dark",
    currencyDisplay: "USD",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    marketingEmails: false,
    tradingAlerts: true,
    securityAlerts: true,
    profileVisibility: "private",
  };
  batch.set(settingsRef, newSettings);

  await batch.commit();
  return newProfile;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const db = getClientFirestore();
  await updateDoc(doc(db, "users", uid), data);
}

export async function getUserSecurity(uid: string): Promise<UserSecurity | null> {
  const db = getClientFirestore();
  const snap = await getDoc(doc(db, "security", uid));
  return snap.exists() ? (snap.data() as UserSecurity) : null;
}

export async function getUserSettings(uid: string): Promise<UserSettings | null> {
  const db = getClientFirestore();
  const snap = await getDoc(doc(db, "settings", uid));
  return snap.exists() ? (snap.data() as UserSettings) : null;
}

export async function getActiveDevices(uid: string): Promise<UserDevice[]> {
  const db = getClientFirestore();
  const snap = await getDocs(collection(db, `devices/${uid}/active`));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserDevice));
}

export async function getLoginHistory(uid: string, maxLimit = 20): Promise<LoginLog[]> {
  const db = getClientFirestore();
  const q = query(
    collection(db, `loginHistory/${uid}/logs`),
    orderBy("time", "desc"),
    limit(maxLimit)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as LoginLog));
}
