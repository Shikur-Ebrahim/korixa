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

    let uid: string;
    let userDocRef;

    const db = getAdminDb();
    // Find user by email
    const snap = await db.collection("users").where("email", "==", email.trim().toLowerCase()).limit(1).get();

    if (snap.empty) {
      // Fallback: check Firebase Auth directly
      const { getAdminAuth } = await import("@/lib/firebase-admin-auth");
      try {
        const authUser = await getAdminAuth().getUserByEmail(email.trim().toLowerCase());
        uid = authUser.uid;
        userDocRef = db.collection("users").doc(uid);
      } catch (authErr: any) {
        if (authErr.code === "auth/user-not-found") {
           return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 });
        }
        throw authErr;
      }
    } else {
      uid = snap.docs[0].id;
      userDocRef = snap.docs[0].ref;
    }

    await userDocRef.set({
      email: email.trim().toLowerCase(),
      uid: uid,
      kycStatus: "verified",
      fullName: fullName.trim(),
      rejectionReason: null,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({
      ok: true,
      uid,
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
