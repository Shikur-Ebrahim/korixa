"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase-admin";
import type { UserDevice, LoginLog } from "@/lib/profile/types";

async function verifyToken(token: string): Promise<string> {
  const app = getAdminApp();
  const auth = getAuth(app);
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken.uid;
  } catch {
    throw new Error("Unauthorized");
  }
}

// ─── Login History ────────────────────────────────────────────────────────────

export async function recordLoginEvent(token: string, data: {
  browser: string;
  os: string;
  deviceType: string;
  ipAddress: string;
  location: string;
  method: "email_otp" | "google";
}) {
  const uid = await verifyToken(token);
  const db = getAdminDb();

  const logEntry: Omit<LoginLog, "id"> = {
    uid,
    time: new Date().toISOString(),
    ipAddress: data.ipAddress,
    browser: data.browser,
    os: data.os,
    location: data.location,
    method: data.method,
    status: "success",
  };

  await db.collection("loginHistory").doc(uid).collection("logs").add(logEntry);

  // Also upsert this device in the devices collection
  const devicesRef = db.collection("devices").doc(uid).collection("list");
  const existing = await devicesRef
    .where("browser", "==", data.browser)
    .where("os", "==", data.os)
    .limit(1)
    .get();

  if (existing.empty) {
    await devicesRef.add({
      uid,
      browser: data.browser,
      os: data.os,
      deviceType: data.deviceType,
      ipAddress: data.ipAddress,
      location: data.location,
      lastActive: new Date().toISOString(),
      isTrusted: false,
    });
  } else {
    await existing.docs[0].ref.update({
      lastActive: new Date().toISOString(),
      ipAddress: data.ipAddress,
    });
  }

  return { success: true };
}

export async function getLoginHistory(token: string): Promise<LoginLog[]> {
  const uid = await verifyToken(token);
  const db = getAdminDb();

  const snap = await db
    .collection("loginHistory")
    .doc(uid)
    .collection("logs")
    .orderBy("time", "desc")
    .limit(20)
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LoginLog));
}

// ─── Device Management ────────────────────────────────────────────────────────

export async function getDevices(token: string): Promise<UserDevice[]> {
  const uid = await verifyToken(token);
  const db = getAdminDb();

  const snap = await db
    .collection("devices")
    .doc(uid)
    .collection("list")
    .orderBy("lastActive", "desc")
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserDevice));
}

export async function trustDevice(token: string, deviceId: string) {
  const uid = await verifyToken(token);
  const db = getAdminDb();
  await db.collection("devices").doc(uid).collection("list").doc(deviceId).update({ isTrusted: true });
  return { success: true };
}

export async function revokeDevice(token: string, deviceId: string) {
  const uid = await verifyToken(token);
  const db = getAdminDb();
  await db.collection("devices").doc(uid).collection("list").doc(deviceId).delete();
  return { success: true };
}
