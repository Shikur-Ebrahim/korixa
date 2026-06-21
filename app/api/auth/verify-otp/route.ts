import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthTokenForEmail, verifyOTP } from "@/lib/otp";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Code must be 6 digits"),
  displayName: z.string().optional(),
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

    const verification = await verifyOTP(parsed.data.email, parsed.data.code);

    if (!verification.valid) {
      return NextResponse.json({ error: verification.error }, { status: 400 });
    }

    const customToken = await createAuthTokenForEmail(
      parsed.data.email,
      parsed.data.displayName
    );

    return NextResponse.json({
      success: true,
      customToken,
      message: "Verification successful.",
    });
  } catch (error) {
    console.error("verify-otp error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
