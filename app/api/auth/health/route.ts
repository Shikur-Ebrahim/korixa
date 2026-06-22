import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Quick check — visit /api/auth/health on production to see missing env vars */
export async function GET() {
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return NextResponse.json({
    ok:
      Boolean(process.env.FIREBASE_PROJECT_ID) &&
      Boolean(process.env.FIREBASE_CLIENT_EMAIL) &&
      Boolean(process.env.FIREBASE_PRIVATE_KEY) &&
      Boolean(process.env.RESEND_API_KEY) &&
      Boolean(fromEmail) &&
      !fromEmail.includes("resend.dev") &&
      Boolean(appUrl) &&
      !appUrl.includes("localhost"),
    firebase: {
      projectId: Boolean(process.env.FIREBASE_PROJECT_ID),
      clientEmail: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
      privateKey: Boolean(process.env.FIREBASE_PRIVATE_KEY),
    },
    resend: {
      apiKey: Boolean(process.env.RESEND_API_KEY),
      fromEmail: fromEmail || "(not set — add Korixa <noreply@korixapay.com>)",
      replyTo: process.env.RESEND_REPLY_TO || "(optional — not required for OTP)",
    },
    appUrl: appUrl || "(not set — use https://www.korixapay.com)",
    hint: "After adding vars in Vercel, click Redeploy (env changes do not apply to old deployments).",
  });
}
