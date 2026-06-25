import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const adminUser = await getAuthUser();
    if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Ensure the caller is an admin
    const adminDoc = await getAdminDb().doc(`users/${adminUser.uid}`).get();
    if (adminDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { targetUid, amount, reason } = await req.json();
    if (!targetUid || !amount || isNaN(amount)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const numAmount = Number(amount);

    const walletRef = getAdminDb().doc(`users/${targetUid}/wallet/default`);
    await walletRef.set(
      {
        balances: {
          USDT: FieldValue.increment(numAmount),
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Record the manual transaction
    await getAdminDb().collection(`users/${targetUid}/transactions`).add({
      type: "manual_adjustment",
      asset: "USDT",
      amount: numAmount,
      reason: reason || "Admin manual funding",
      status: "completed",
      timestamp: new Date().toISOString(),
      adminId: adminUser.uid,
    });

    return NextResponse.json({ success: true, added: numAmount });
  } catch (error) {
    console.error("Error manually funding user:", error);
    return NextResponse.json({ error: "Failed to fund user" }, { status: 500 });
  }
}
