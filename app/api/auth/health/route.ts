import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getFromEmail, getResend } from "@/lib/resend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Visit /api/auth/health — checks env vars AND live Firebase/Resend connectivity */
export async function GET() {
  const fromEmail = getFromEmail();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const envOk =
    Boolean(process.env.FIREBASE_PROJECT_ID) &&
    Boolean(process.env.FIREBASE_CLIENT_EMAIL) &&
    Boolean(process.env.FIREBASE_PRIVATE_KEY) &&
    Boolean(process.env.RESEND_API_KEY) &&
    Boolean(fromEmail) &&
    !fromEmail.includes("resend.dev") &&
    Boolean(appUrl) &&
    !appUrl.includes("localhost");

  let firebaseLive: { ok: boolean; error?: string } = { ok: false };
  try {
    await getAdminDb()
      .collection("_health_check")
      .doc("ping")
      .set({ checkedAt: new Date().toISOString() }, { merge: true });
    firebaseLive = { ok: true };
  } catch (error) {
    firebaseLive = {
      ok: false,
      error: error instanceof Error ? error.message : "Firebase connection failed.",
    };
  }

  let resendLive: { ok: boolean; error?: string } = { ok: false };
  try {
    getResend();
    resendLive = { ok: true };
  } catch (error) {
    resendLive = {
      ok: false,
      error: error instanceof Error ? error.message : "Resend client failed.",
    };
  }

  const ok = envOk && firebaseLive.ok && resendLive.ok;

  return NextResponse.json({
    ok,
    envOk,
    firebase: {
      projectId: Boolean(process.env.FIREBASE_PROJECT_ID),
      clientEmail: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
      privateKey: Boolean(process.env.FIREBASE_PRIVATE_KEY),
      live: firebaseLive,
    },
    resend: {
      apiKey: Boolean(process.env.RESEND_API_KEY),
      fromEmail: fromEmail || "(not set)",
      replyTo: process.env.RESEND_REPLY_TO || "(optional)",
      live: resendLive,
    },
    appUrl: appUrl || "(not set)",
    hint: firebaseLive.ok
      ? "Env vars and Firebase are working. Sign-up should work after redeploy."
      : "Create Firestore in Firebase Console (Build → Firestore → Create database), or fix FIREBASE_PRIVATE_KEY in Vercel.",
  });
}
