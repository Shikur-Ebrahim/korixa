import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import { getAdminDb } from "@/lib/firebase-admin";
import { getAdminAuth } from "@/lib/firebase-admin-auth";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const decoded = await verifyAuthToken(req);
    const uid = decoded.uid;

    const { type, coin, amount, fee, destination, network, etbRate } = await req.json();

    if (!type || !coin || !amount || amount <= 0 || !destination) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
    }

    const db = getAdminDb();

    // Find the user's funding wallet for the given coin
    const walletQuery = await db.collection("wallets")
      .where("userId", "==", uid)
      .where("type", "==", "funding")
      .where("coin", "==", coin)
      .limit(1)
      .get();

    if (walletQuery.empty) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const walletDoc = walletQuery.docs[0];
    const walletData = walletDoc.data();

    if ((walletData.balance ?? 0) < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // ── INTERNAL TRANSFER ──────────────────────────────────────────────────
    if (type === "internal_transfer") {
      let recipientUser;
      try {
        if (destination.includes("@")) {
          recipientUser = await getAdminAuth().getUserByEmail(destination);
        } else {
          recipientUser = await getAdminAuth().getUser(destination);
        }
      } catch {
        return NextResponse.json({ error: "Recipient not found. Check the email/UID." }, { status: 404 });
      }

      if (recipientUser.uid === uid) {
        return NextResponse.json({ error: "Cannot transfer to yourself" }, { status: 400 });
      }

      // Find receiver's funding wallet
      const recWalletQuery = await db.collection("wallets")
        .where("userId", "==", recipientUser.uid)
        .where("type", "==", "funding")
        .where("coin", "==", coin)
        .limit(1)
        .get();

      const batch = db.batch();
      // Deduct sender
      batch.update(walletDoc.ref, { balance: FieldValue.increment(-amount) });

      if (recWalletQuery.empty) {
        // Create receiver wallet
        const newRef = db.collection("wallets").doc();
        batch.set(newRef, {
          userId: recipientUser.uid,
          type: "funding",
          coin,
          balance: amount,
          name: coin === "USDT" ? "Tether USDT" : coin,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        batch.update(recWalletQuery.docs[0].ref, { balance: FieldValue.increment(amount) });
      }

      // Log
      const withdrawalRef = db.collection("withdrawals").doc();
      batch.set(withdrawalRef, {
        userId: uid,
        type: "internal_transfer",
        coin,
        amount,
        fee: 0,
        netAmount: amount,
        status: "completed",
        destination: recipientUser.uid,
        destinationEmail: recipientUser.email ?? destination,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await batch.commit();
      return NextResponse.json({ success: true, message: "Transfer successful" });
    }

    // ── ON-CHAIN or FIAT (admin manual) ───────────────────────────────────
    if (type === "crypto_onchain" || type === "fiat_etb") {
      const batch = db.batch();

      // Deduct balance immediately to lock funds
      batch.update(walletDoc.ref, { balance: FieldValue.increment(-amount) });

      const netAmount = type === "crypto_onchain" ? amount - (fee ?? 0) : amount;
      const withdrawalRef = db.collection("withdrawals").doc();
      batch.set(withdrawalRef, {
        userId: uid,
        type,
        coin,
        amount,
        fee: fee ?? 0,
        netAmount,
        status: "pending",
        destination,
        network: network ?? null,
        etbRate: etbRate ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await batch.commit();
      return NextResponse.json({ success: true, message: "Withdrawal request submitted" });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (e: any) {
    console.error("Withdrawal error:", e);
    return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
  }
}
