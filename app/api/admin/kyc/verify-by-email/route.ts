import { NextResponse } from "next/server";
import { getRoleFromToken } from "@/lib/auth/get-role";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getRoleFromToken(token);
    if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json() as { email: string; fullName: string };
    const { email, fullName } = body;

    if (!email || !fullName) {
      return NextResponse.json({ error: "Email and full name are required." }, { status: 400 });
    }

    const db = getAdminDb();
    // Find user by email
    const snap = await db.collection("users").where("email", "==", email.trim().toLowerCase()).limit(1).get();

    if (snap.empty) {
      return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 });
    }

    const userDoc = snap.docs[0];
    await userDoc.ref.update({
      kycStatus: "verified",
      fullName: fullName.trim(),
      rejectionReason: null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      ok: true,
      uid: userDoc.id,
      email,
      kycStatus: "verified",
      message: `User ${email} has been verified successfully.`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification failed" },
      { status: 500 }
    );
  }
}
