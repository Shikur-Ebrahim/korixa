"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import speakeasy from "speakeasy";
import crypto from "crypto";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase-admin";

async function verifyToken(token: string): Promise<string> {
  const app = getAdminApp();
  const auth = getAuth(app);
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    throw new Error("Unauthorized");
  }
}

export async function generateMfaSecret(token: string, email: string) {
  const uid = await verifyToken(token);
  
  const secret = speakeasy.generateSecret({ length: 20, name: `Korixa (${email})` });
  
  return { 
    secret: secret.base32, 
    otpauthUrl: secret.otpauth_url 
  };
}

export async function verifyAndEnableMfa(token: string, secret: string, code: string) {
  const uid = await verifyToken(token);

  const isValid = speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: code,
    window: 1 // allows 1 step before/after to account for slight clock drift
  });

  if (!isValid) {
    throw new Error("Invalid authentication code.");
  }

  const db = getAdminDb();
  await db.collection("security").doc(uid).set({
    mfaEnabled: true,
    mfaSecret: secret // In a highly secure app, this should be encrypted at rest
  }, { merge: true });

  return { success: true };
}

export async function generateRecoveryCodes(token: string) {
  const uid = await verifyToken(token);

  // Generate 10 random 8-character hex codes
  const codes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex'));

  const db = getAdminDb();
  await db.collection("security").doc(uid).set({
    recoveryCodesGenerated: true,
    recoveryCodes: codes // In production, store hashes of these codes
  }, { merge: true });

  return { success: true, codes };
}

export async function updateAntiPhishingCode(token: string, code: string) {
  const uid = await verifyToken(token);

  if (code.length > 20) {
    throw new Error("Anti-phishing code cannot exceed 20 characters.");
  }

  const db = getAdminDb();
  await db.collection("security").doc(uid).set({
    antiPhishingCode: code
  }, { merge: true });

  return { success: true };
}

export async function verifyLoginMfa(token: string, code: string) {
  const uid = await verifyToken(token);
  const db = getAdminDb();
  
  const doc = await db.collection("security").doc(uid).get();
  if (!doc.exists) throw new Error("Security settings not found");
  
  const data = doc.data();
  if (!data?.mfaEnabled || !data?.mfaSecret) {
    return { success: true }; // MFA not enabled
  }

  const isValid = speakeasy.totp.verify({
    secret: data.mfaSecret,
    encoding: 'base32',
    token: code,
    window: 1
  });

  if (!isValid) {
    throw new Error("Invalid authenticator code.");
  }

  return { success: true };
}

export async function verifyLoginRecoveryCode(token: string, code: string) {
  const uid = await verifyToken(token);
  const db = getAdminDb();
  
  const docRef = db.collection("security").doc(uid);
  const doc = await docRef.get();
  if (!doc.exists) throw new Error("Security settings not found");
  
  const data = doc.data();
  if (!data?.recoveryCodesGenerated || !data?.recoveryCodes) {
    throw new Error("Recovery codes not enabled for this account.");
  }

  const codes: string[] = data.recoveryCodes;
  const codeIndex = codes.findIndex(c => c === code);

  if (codeIndex === -1) {
    throw new Error("Invalid recovery code.");
  }

  // Remove the used recovery code
  codes.splice(codeIndex, 1);
  await docRef.update({ recoveryCodes: codes });

  return { success: true, remaining: codes.length };
}
