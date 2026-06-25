import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import { getAdminAuth } from "@/lib/firebase-admin-auth";

export async function POST(req: Request) {
  try {
    const user = await verifyAuthToken(req);
    const { oldPassword, newPassword } = await req.json();

    if (!oldPassword) {
      return NextResponse.json({ error: "Current password is required" }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }

    // Get the user's email so we can re-authenticate on the client side
    // On server side, we verify the old password by calling Firebase REST API
    const adminAuth = getAdminAuth();
    const userRecord = await adminAuth.getUser(user.uid);
    const email = userRecord.email;

    if (!email) {
      return NextResponse.json({ error: "Admin account has no email" }, { status: 400 });
    }

    // Verify old password using Firebase Auth REST API
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: oldPassword,
          returnSecureToken: false,
        }),
      }
    );

    if (!verifyRes.ok) {
      const err = await verifyRes.json();
      const msg = err?.error?.message;
      if (msg === "INVALID_PASSWORD" || msg === "INVALID_LOGIN_CREDENTIALS") {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
      }
      return NextResponse.json({ error: "Could not verify current password" }, { status: 401 });
    }

    // Old password is correct — now update to new password
    await adminAuth.updateUser(user.uid, {
      password: newPassword,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating password:", error);
    return NextResponse.json({ error: error.message || "Failed to update password" }, { status: 500 });
  }
}
