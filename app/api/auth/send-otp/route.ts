import { NextResponse } from "next/server";
import { z } from "zod";
import { sendVerificationOTP } from "@/lib/otp";

const schema = z.object({
  email: z.string().email("Invalid email address"),
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

    const result = await sendVerificationOTP(parsed.data.email);
    return NextResponse.json(result);
  } catch (error) {
    console.error("send-otp error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to send verification code.";

    const isDomainIssue =
      message.includes("resend.dev") ||
      message.includes("verify") ||
      message.includes("domain") ||
      message.includes("only send");

    return NextResponse.json(
      {
        error: isDomainIssue
          ? "Email could not be sent. Set RESEND_FROM_EMAIL to your verified domain (e.g. Korixa <noreply@korixapay.com>) in Vercel."
          : "Failed to send verification code. Please try again.",
      },
      { status: isDomainIssue ? 503 : 500 }
    );
  }
}
