import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import { getAdminAuth } from "@/lib/firebase-admin-auth";

export async function POST(req: Request) {
  try {
    const user = await verifyAuthToken(req);
    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    await getAdminAuth().updateUser(user.uid, {
      password: newPassword,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating password:", error);
    return NextResponse.json({ error: error.message || "Failed to update password" }, { status: 500 });
  }
}
