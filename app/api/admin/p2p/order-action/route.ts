import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Recalculates and updates a merchant's totalOrders and completionRate
 * based on all their resolved (completed + cancelled) orders.
 */
async function updateMerchantStats(db: FirebaseFirestore.Firestore, merchantId: string) {
  if (!merchantId) return;

  try {
    // Get all orders for this merchant that have a final status
    const ordersSnap = await db.collection("p2pOrders")
      .where("merchantId", "==", merchantId)
      .where("status", "in", ["completed", "cancelled"])
      .get();

    const totalOrders = ordersSnap.size;
    const completedOrders = ordersSnap.docs.filter(d => d.data().status === "completed").length;
    const completionRate = totalOrders > 0
      ? Math.round((completedOrders / totalOrders) * 100 * 100) / 100 // e.g. 98.73
      : 100;

    // Update the merchant document
    await db.collection("merchants").doc(merchantId).update({
      totalOrders,
      completionRate,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    // Non-fatal — don't block the order action
    console.error("Failed to update merchant stats:", err);
  }
}

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

      // Find the user's USDT funding wallet
      const walletSnapshot = await db.collection("wallets")
        .where("userId", "==", buyerId)
        .where("type", "==", "funding")
        .where("coin", "==", "USDT")
        .limit(1)
        .get();

      if (!walletSnapshot.empty) {
        // Increment the balance
        const walletDoc = walletSnapshot.docs[0];
        await walletDoc.ref.update({
          balance: FieldValue.increment(amountUSDT),
          availableBalance: FieldValue.increment(amountUSDT),
        });
      } else {
        // Fallback: create it if it somehow doesn't exist
        await db.collection("wallets").add({
          userId: buyerId,
          type: "funding",
          coin: "USDT",
          name: "Tether US",
          balance: amountUSDT,
          availableBalance: amountUSDT,
          lockedBalance: 0,
          usdValue: 0,
          change24h: 0,
        });
      }

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

      // Update merchant completion rate
      await updateMerchantStats(db, order.merchantId);

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

      // Update merchant completion rate
      await updateMerchantStats(db, order.merchantId);

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
