import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    // 1. Verify admin
    const adminUser = await verifyAuthToken(req);
    const db = getAdminDb();

    const adminDoc = await db.doc(`users/${adminUser.uid}`).get();
    if (adminDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { orderId, action } = await req.json();
    if (!orderId || !action) {
      return NextResponse.json({ error: "Missing orderId or action" }, { status: 400 });
    }
    if (action !== "release" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // 2. Fetch the order
    const orderRef = db.doc(`p2pOrders/${orderId}`);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderSnap.data()!;

    // Only act on orders in "paid" status
    if (order.status !== "paid") {
      return NextResponse.json({ error: `Order is not in paid status (current: ${order.status})` }, { status: 400 });
    }

    if (action === "release") {
      // 3a. Release: Credit buyer's funding wallet + mark order completed
      const buyerId = order.buyerId;
      const amountUSDT = order.amountUSDT;

      if (!buyerId || !amountUSDT) {
        return NextResponse.json({ error: "Order missing buyerId or amountUSDT" }, { status: 400 });
      }

      // Credit the buyer's wallet
      const walletRef = db.doc(`users/${buyerId}/wallet/default`);
      await walletRef.set(
        {
          balances: { USDT: FieldValue.increment(amountUSDT) },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Mark order as completed
      await orderRef.update({
        status: "completed",
        releasedAt: new Date().toISOString(),
        releasedBy: adminUser.uid,
      });

      // Record transaction for the buyer
      await db.collection(`users/${buyerId}/transactions`).add({
        type: "p2p_buy",
        asset: "USDT",
        amount: amountUSDT,
        status: "completed",
        orderId,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: `Released ${amountUSDT} USDT to buyer ${buyerId}`,
      });

    } else {
      // 3b. Reject: just mark order as cancelled, no wallet change
      await orderRef.update({
        status: "cancelled",
        rejectedAt: new Date().toISOString(),
        rejectedBy: adminUser.uid,
      });

      return NextResponse.json({
        success: true,
        message: "Order rejected. No funds transferred.",
      });
    }

  } catch (error: any) {
    console.error("P2P order action error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
