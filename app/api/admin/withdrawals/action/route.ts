import { NextResponse } from "next/server";
import { getRoleFromToken } from "@/lib/auth/get-role";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth } from "@/lib/firebase-admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getRoleFromToken(token);
    if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { withdrawalId, action } = await req.json();
    if (!withdrawalId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const db = getAdminDb();
    const withdrawalRef = db.collection("withdrawals").doc(withdrawalId);
    const withdrawalSnap = await withdrawalRef.get();

    if (!withdrawalSnap.exists) {
      return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
    }

    const withdrawal = withdrawalSnap.data()!;

    if (withdrawal.status !== "pending") {
      return NextResponse.json({ error: "Withdrawal is not pending" }, { status: 400 });
    }

    const decoded = await getAdminAuth().verifyIdToken(token);

    if (action === "approve") {
      await withdrawalRef.update({
        status: "completed",
        processedAt: new Date().toISOString(),
        processedBy: decoded.uid,
      });
    } else if (action === "reject") {
      // Refund the user's funding wallet
      const walletsRef = db.collection("wallets");
      const walletQuery = await walletsRef
        .where("userId", "==", withdrawal.userId)
        .where("type", "==", "funding")
        .where("coin", "==", withdrawal.coin)
        .limit(1)
        .get();

      const batch = db.batch();

      if (!walletQuery.empty) {
        batch.update(walletQuery.docs[0].ref, {
          balance: FieldValue.increment(withdrawal.amount),
        });
      }

      batch.update(withdrawalRef, {
        status: "rejected",
        processedAt: new Date().toISOString(),
        processedBy: decoded.uid,
      });

      await batch.commit();
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
