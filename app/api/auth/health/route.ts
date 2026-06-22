import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Visit /api/auth/health — always returns JSON (never crashes) */
export async function GET() {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "";
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
      const { getAdminDb } = await import("@/lib/firebase-admin");
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
      const { getResend } = await import("@/lib/resend");
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
        ? "All good — try sign-up now."
        : firebaseLive.error?.includes("ERR_REQUIRE_ESM") ||
            firebaseLive.error?.includes("jwks-rsa") ||
            firebaseLive.error?.includes("jose")
          ? "Firebase Admin auth module conflict — redeploy latest code from GitHub."
          : firebaseLive.error?.includes("DECODER") || firebaseLive.error?.includes("private key")
            ? "Fix FIREBASE_PRIVATE_KEY in Vercel — paste key with real line breaks (BEGIN to END)."
            : "Enable Firestore in Firebase Console, or fix FIREBASE_PRIVATE_KEY in Vercel.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Health check failed.",
      },
      { status: 200 }
    );
  }
}
