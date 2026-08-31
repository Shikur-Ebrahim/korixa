import { NextResponse } from "next/server";
import { getAdminDb } from "@/src/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, country, phoneNumber, message } = body;

    if (!fullName || !country || !phoneNumber || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const db = getAdminDb();

    await db.collection("messages").add({
      fullName,
      country,
      phoneNumber,
      message,
      status: "new",
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
