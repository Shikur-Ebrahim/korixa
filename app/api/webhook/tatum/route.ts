import { NextResponse } from "next/server";
import { processTatumWebhook } from "@/lib/deposit/webhook";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const result = await processTatumWebhook(payload);

    if (!result.ok) {
      return NextResponse.json({ received: true, ...result }, { status: 200 });
    }

    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    console.error("tatum webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "tatum-webhook" });
}
