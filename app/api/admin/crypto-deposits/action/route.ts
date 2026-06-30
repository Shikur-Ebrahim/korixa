import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getRoleFromToken } from "@/lib/auth/get-role";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await verifyAuthToken(request);
    const role = await getRoleFromToken(token);
    if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const adminUid = decoded.uid;


    const data = await request.json();
    const { id, action, amount } = data; // action: 'approve' | 'reject', amount can be overridden by admin

    if (!id || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getAdminDb();
    const depositRef = db.collection("manualCryptoDeposits").doc(id);
    const depositDoc = await depositRef.get();

    if (!depositDoc.exists) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    }

    const depositData = depositDoc.data()!;
    if (depositData.status !== "pending") {
      return NextResponse.json({ error: "Deposit is already processed" }, { status: 400 });
    }

    const finalAmount = amount ? Number(amount) : Number(depositData.amount);

    if (action === "approve") {
      // 1. Update deposit status
      await depositRef.update({
        status: "approved",
        approvedAmount: finalAmount,
        processedAt: new Date().toISOString(),
        processedBy: decoded.uid,
      });

      // 2. Credit the new wallet schema
      const walletRef = db.doc(`users/${depositData.userId}/wallet/default`);
      await walletRef.set(
        {
          balances: { USDT: FieldValue.increment(finalAmount) },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // 3. Credit the legacy wallets schema
      const legacyWalletQuery = await db.collection("wallets")
        .where("userId", "==", depositData.userId)
        .where("type", "==", "funding")
        .where("coin", "==", "USDT")
        .limit(1)
        .get();
        
      if (!legacyWalletQuery.empty) {
        await legacyWalletQuery.docs[0].ref.update({
          balance: FieldValue.increment(finalAmount),
          availableBalance: FieldValue.increment(finalAmount),
          usdValue: FieldValue.increment(finalAmount),
        });
      } else {
        await db.collection("wallets").add({
          userId: depositData.userId,
          type: "funding",
          coin: "USDT",
          name: "Tether US",
          balance: finalAmount,
          availableBalance: finalAmount,
          lockedBalance: 0,
          usdValue: finalAmount,
          change24h: 0,
        });
      }

      // 4. Create transaction record
      await db.collection("transactions").add({
        userId: depositData.userId,
        type: "crypto_deposit",
        coin: "USDT",
        amount: finalAmount,
        usdValue: finalAmount,
        status: "completed",
        timestamp: Date.now(),
        network: depositData.networkName,
        txId: depositData.txId || id,
      });

      // 5. Send notification
      await db.collection(`users/${depositData.userId}/notifications`).add({
        type: "deposit",
        title: "Deposit Approved",
        message: `Your deposit of ${finalAmount} USDT via ${depositData.networkName} has been approved and credited.`,
        amount: finalAmount,
        asset: "USDT",
        read: false,
        createdAt: new Date().toISOString(),
      });

    } else if (action === "reject") {
      await depositRef.update({
        status: "rejected",
        processedAt: new Date().toISOString(),
        processedBy: decoded.uid,
      });
      
      // Send notification
      await db.collection(`users/${depositData.userId}/notifications`).add({
        type: "deposit_rejected",
        title: "Deposit Rejected",
        message: `Your deposit of ${depositData.amount} USDT via ${depositData.networkName} was rejected. Please contact support.`,
        amount: depositData.amount,
        asset: "USDT",
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to process deposit", error);
    return NextResponse.json({ error: "Failed to process deposit" }, { status: 500 });
  }
}
