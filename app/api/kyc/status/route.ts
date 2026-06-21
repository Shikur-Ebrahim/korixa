import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, verifyAuthToken } from "@/lib/auth/verify-token";
import { ensureUserRecord, getUserKycRecord } from "@/lib/kyc/firestore";

export async function GET(request: Request) {
  try {
    const decoded = await verifyAuthToken(request);
    const existing = await getUserKycRecord(decoded.uid);

    const kyc =
      existing ??
      (await ensureUserRecord(decoded.uid, decoded.email ?? ""));

    return NextResponse.json({ kyc });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("kyc status error:", error);
    return NextResponse.json({ error: "Failed to load KYC status." }, { status: 500 });
  }
}
