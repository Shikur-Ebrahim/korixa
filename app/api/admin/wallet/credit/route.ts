import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/admin/wallet/credit
 * 
 * Manually credit USDT to a user's wallet.
 * Used by admin to fix missing deposits where TronGrid detected a transaction
 * but the user's balance was not updated automatically.
 * 
 * Body: { userId, amount, txId, reason }
 */
export async function POST(req: Request) {
  try {
    const adminUser = await verifyAuthToken(req);
    const db = getAdminDb();

    // Ensure caller is admin
    const adminDoc = await db.doc(`users/${adminUser.uid}`).get();
    if (adminDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, amount, txId, reason } = await req.json();

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ error: "userId and a positive amount are required" }, { status: 400 });
    }

    const amountNum = Number(amount);
    if (!isFinite(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Check if txId was already processed (prevent double crediting)
    if (txId) {
      const existingTx = await db.doc(`deposits/${txId.toLowerCase()}`).get();
      if (existingTx.exists && existingTx.data()?.status === "confirmed") {
        return NextResponse.json({ error: "This transaction has already been credited." }, { status: 409 });
      }
    }

    // Credit the user's wallet
    const walletRef = db.doc(`users/${userId}/wallet/default`);
    await walletRef.set(
      {
        balances: { USDT: FieldValue.increment(amountNum) },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Record transaction
    const txRef = txId
      ? db.doc(`deposits/${txId.toLowerCase()}`)
      : db.collection("deposits").doc();

    await txRef.set({
      id: txRef.id,
      userId,
      chain: "TRC20",
      token: "USDT",
      amount: amountNum,
      txHash: txId || "manual_credit_" + Date.now(),
      status: "confirmed",
      confirmations: 1,
      blockNumber: null,
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      manualCredit: true,
      creditedBy: adminUser.uid,
      creditReason: reason || "Manual admin credit",
    });

    // Also add to user's transactions subcollection for history view
    await db.collection(`users/${userId}/transactions`).add({
      type: "deposit",
      asset: "USDT",
      amount: amountNum,
      status: "completed",
      timestamp: new Date().toISOString(),
      chain: "TRC20",
      txId: txId || "manual_credit_" + Date.now(),
      note: reason || "Manual admin credit",
    });

    // Audit log
    await db.collection("activityLogs").add({
      adminId: adminUser.uid,
      adminEmail: adminUser.email,
      action: "manual_credit_usdt",
      targetUserId: userId,
      amount: amountNum,
      txId: txId || null,
      reason: reason || "Manual admin credit",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      credited: amountNum,
      userId,
      message: `Successfully credited ${amountNum} USDT to user ${userId}`,
    });
  } catch (error: any) {
    console.error("Error manually crediting wallet:", error);
    return NextResponse.json({ error: "Failed to credit wallet: " + error.message }, { status: 500 });
  }
}
