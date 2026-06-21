import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, verifyAuthToken } from "@/lib/auth/verify-token";
import { submitUserKyc } from "@/lib/kyc/firestore";

const schema = z.object({
  idImageUrl: z.string().url(),
  selfieImageUrl: z.string().url(),
  extractedIdData: z.object({
    name: z.string().nullable(),
    idNumber: z.string().nullable(),
    dob: z.string().nullable(),
    rawText: z.string(),
  }),
  faceMatchDistance: z.number(),
  faceMatchScore: z.number(),
  livenessPassed: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const decoded = await verifyAuthToken(request);
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const kyc = await submitUserKyc(decoded.uid, decoded.email ?? "", parsed.data);

    return NextResponse.json({
      success: true,
      kyc,
      message:
        kyc.kycStatus === "verified"
          ? "Identity verified successfully."
          : kyc.kycStatus === "rejected"
            ? kyc.rejectionReason ?? "Verification rejected."
            : "Verification submitted.",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("kyc submit error:", error);
    return NextResponse.json({ error: "Failed to submit KYC." }, { status: 500 });
  }
}
