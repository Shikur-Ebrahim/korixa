"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { getAdminAuth } from "@/lib/firebase-admin-auth";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function executeTransfer(token: string, asset: string, amount: number, from: "funding" | "spot", to: "funding" | "spot") {
  if (amount <= 0) throw new Error("Amount must be greater than 0");
  if (from === to) throw new Error("Source and destination must be different");

  const auth = await getAdminAuth();
  const decoded = await auth.verifyIdToken(token);
  const uid = decoded.uid;

  const db = getAdminDb();
  
  // To keep it simple and fast, we'll try to find the wallet documents for the user
  const walletsRef = db.collection("wallets");
  
  const sourceSnapshot = await walletsRef.where("userId", "==", uid).where("type", "==", from).where("coin", "==", asset).limit(1).get();
  const destSnapshot = await walletsRef.where("userId", "==", uid).where("type", "==", to).where("coin", "==", asset).limit(1).get();

  if (sourceSnapshot.empty) {
    throw new Error(`Insufficient ${asset} balance in ${from} account.`);
  }

  const sourceDoc = sourceSnapshot.docs[0];
  const sourceData = sourceDoc.data();

  if (sourceData.availableBalance < amount) {
    throw new Error(`Insufficient ${asset} balance. Available: ${sourceData.availableBalance}`);
  }

  // Calculate proportional USD value to move (assuming usdValue scales linearly with balance)
  const usdValueToMove = (amount / sourceData.balance) * sourceData.usdValue;

  const batch = db.batch();

  // Deduct from source
  batch.update(sourceDoc.ref, {
    balance: FieldValue.increment(-amount),
    availableBalance: FieldValue.increment(-amount),
    usdValue: FieldValue.increment(-usdValueToMove)
  });

  // Add to destination
  if (!destSnapshot.empty) {
    const destDoc = destSnapshot.docs[0];
    batch.update(destDoc.ref, {
      balance: FieldValue.increment(amount),
      availableBalance: FieldValue.increment(amount),
      usdValue: FieldValue.increment(usdValueToMove)
    });
  } else {
    // Create destination wallet if it doesn't exist
    const newDestRef = walletsRef.doc();
    batch.set(newDestRef, {
      userId: uid,
      type: to,
      coin: asset,
      name: sourceData.name || asset, // Fallback name
      balance: amount,
      availableBalance: amount,
      lockedBalance: 0,
      usdValue: usdValueToMove,
      change24h: sourceData.change24h || 0,
      avgBuyPrice: sourceData.currentPrice || 0,
      currentPrice: sourceData.currentPrice || 0,
      unrealizedPnl: 0,
      value: usdValueToMove
    });
  }

  // Create transaction record
  const txRef = db.collection("transactions").doc();
  batch.set(txRef, {
    userId: uid,
    type: "transfer",
    coin: asset,
    amount: amount,
    usdValue: usdValueToMove,
    status: "completed",
    timestamp: Timestamp.now().toMillis(),
    fromAccount: from,
    toAccount: to
  });

  await batch.commit();

  return { success: true };
}
