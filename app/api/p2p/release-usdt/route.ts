import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const auth = await verifyAuthToken(req);
    if (!auth?.uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const db = getAdminDb();
    const orderRef = db.collection("p2pOrders").doc(orderId);

    let merchantIdToUpdate = "";

    await db.runTransaction(async (t) => {
      const orderDoc = await t.get(orderRef);
      if (!orderDoc.exists) throw new Error("Order not found");
      
      const orderData = orderDoc.data()!;
      merchantIdToUpdate = orderData.merchantId;
      
      if (orderData.status !== "paid") throw new Error("Order must be 'paid' to release.");
      if (orderData.type !== "sell") throw new Error("Invalid order type for this action.");
      if (orderData.buyerId !== auth.uid) throw new Error("Only the seller can release.");

      // 1. Deduct from User's funding wallet
      const walletsSnap = await t.get(
        db.collection("wallets")
          .where("userId", "==", auth.uid)
          .where("coin", "==", "USDT")
          .where("type", "==", "funding")
      );

      if (walletsSnap.empty) throw new Error("Funding wallet not found.");
      const walletDoc = walletsSnap.docs[0];
      const currentBalance = walletDoc.data().balance || 0;

      if (currentBalance < orderData.amountUSDT) {
        throw new Error("Insufficient funding wallet balance to release USDT. Please deposit funds first.");
      }

      t.update(walletDoc.ref, {
        balance: FieldValue.increment(-orderData.amountUSDT)
      });

      // 2. Add to Merchant's availableUSDT
      const merchantRef = db.collection("merchants").doc(orderData.merchantId);
      t.update(merchantRef, {
        availableUSDT: FieldValue.increment(orderData.amountUSDT)
      });

      // 3. Mark order as completed
      t.update(orderRef, {
        status: "completed",
        releasedAt: new Date().toISOString(),
        releasedBy: auth.uid
      });
    });

    // Update merchant stats asynchronously
    updateMerchantStats(db, merchantIdToUpdate).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Release USDT error:", err);
    return NextResponse.json({ error: err.message || "Failed to release" }, { status: 500 });
  }
}

async function updateMerchantStats(db: FirebaseFirestore.Firestore, merchantId: string) {
  if (!merchantId) return;
  try {
    const merchantDoc = await db.collection("merchants").doc(merchantId).get();
    if (!merchantDoc.exists) return;
    const merchantData = merchantDoc.data()!;
    const seedTotalOrders = merchantData.seedTotalOrders || 0;
    const seedCompletedOrders = merchantData.seedCompletedOrders || 0;

    const ordersSnap = await db.collection("p2pOrders")
      .where("merchantId", "==", merchantId)
      .where("status", "in", ["completed", "cancelled"])
      .get();

    const realTotalOrders = ordersSnap.size;
    const realCompletedOrders = ordersSnap.docs.filter(d => d.data().status === "completed").length;

    const finalTotalOrders = realTotalOrders + seedTotalOrders;
    const finalCompletedOrders = realCompletedOrders + seedCompletedOrders;

    const completionRate = finalTotalOrders > 0
      ? Math.round((finalCompletedOrders / finalTotalOrders) * 100 * 100) / 100
      : 100;

    await db.collection("merchants").doc(merchantId).update({
      totalOrders: finalTotalOrders,
      completionRate,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to update merchant stats:", err);
  }
}
