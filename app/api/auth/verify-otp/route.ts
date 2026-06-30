import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const schema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Code must be 6 digits"),
  displayName: z.string().optional(),
  isSignIn: z.boolean().optional().default(false),
  refCode: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const { createAuthTokenForEmail, verifyOTP } = await import("@/lib/otp");
    const verification = await verifyOTP(parsed.data.email, parsed.data.code, parsed.data.isSignIn);

    if (!verification.valid) {
      return NextResponse.json({ error: verification.error }, { status: 400 });
    }

    const customToken = await createAuthTokenForEmail(
      parsed.data.email,
      parsed.data.displayName,
      parsed.data.isSignIn,
      parsed.data.refCode
    );

    return NextResponse.json({
      success: true,
      customToken,
      message: "Verification successful.",
    });
  } catch (error) {
    console.error("verify-otp error:", error);
    const message =
      error instanceof Error ? error.message : "Verification failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
