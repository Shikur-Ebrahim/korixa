/**
 * set-admin.js — Korixa Admin Role Assignment Script
 *
 * Usage:
 *   node set-admin.js user@email.com
 *
 * What it does:
 *   1. Finds the Firebase user by email
 *   2. Sets custom claim { role: "admin" } on their token
 *   3. Updates Firestore users/{uid} with role: "admin"
 *
 * Requires .env at project root with FIREBASE_* variables.
 */

require("dotenv").config({ path: ".env" });

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

const email = process.argv[2];

if (!email || !email.includes("@")) {
  console.error("❌  Usage: node set-admin.js user@email.com");
  process.exit(1);
}

function getPrivateKey() {
  let key = process.env.FIREBASE_PRIVATE_KEY ?? "";
  key = key.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

function getClientEmail() {
  let email = (process.env.FIREBASE_CLIENT_EMAIL ?? "").trim();
  const markdownMatch = email.match(/^\[([^\]]+)\]\([^)]+\)$/);
  if (markdownMatch) {
    email = markdownMatch[1];
  }
  return email.replace(/^mailto:/i, "").trim();
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: getClientEmail(),
      privateKey: getPrivateKey(),
    }),
  });
}

const adminAuth = getAuth();
const adminDb = getFirestore();

async function setAdmin() {
  console.log(`\n🔍  Looking up user: ${email}`);

  let user;
  try {
    user = await adminAuth.getUserByEmail(email);
  } catch {
    console.error(`❌  No Firebase user found with email: ${email}`);
    console.error("    Create the account first via the Korixa sign-up page.");
    process.exit(1);
  }

  const { uid, displayName } = user;
  console.log(`✅  Found user: ${displayName ?? "(no display name)"} (uid: ${uid})`);

  // 1. Set Firebase custom claim
  await adminAuth.setCustomUserClaims(uid, { role: "admin" });
  console.log("✅  Firebase custom claim set: { role: 'admin' }");

  // 2. Update Firestore users document
  const ref = adminDb.collection("users").doc(uid);
  const snapshot = await ref.get();

  if (snapshot.exists) {
    await ref.update({ role: "admin" });
  } else {
    await ref.set({
      userId: uid,
      email,
      role: "admin",
      kycStatus: "verified",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  console.log("✅  Firestore users/" + uid + " updated: { role: 'admin' }");

  console.log("\n🎉  Done! " + email + " is now an admin.");
  console.log("    They must sign out and sign back in for the claim to take effect.\n");
}

setAdmin().catch((err) => {
  console.error("❌  Unexpected error:", err.message ?? err);
  process.exit(1);
});
