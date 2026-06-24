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
  
  const walletsRef = db.collection("wallets");
  
  const sourceSnapshot = await walletsRef.where("userId", "==", uid).where("type", "==", from).where("coin", "==", asset).limit(1).get();
  const destSnapshot = await walletsRef.where("userId", "==", uid).where("type", "==", to).where("coin", "==", asset).limit(1).get();

  if (sourceSnapshot.empty) {
    throw new Error(`Insufficient ${asset} balance in ${from} account.`);
  }

  const sourceDoc = sourceSnapshot.docs[0];
  const sourceData = sourceDoc.data();

  // Funding wallets use availableBalance, Spot wallets use amount
  const sourceAvailable = from === "funding" ? (sourceData.availableBalance || 0) : (sourceData.amount || 0);

  if (sourceAvailable < amount) {
    throw new Error(`Insufficient ${asset} balance. Available: ${sourceAvailable}`);
  }

  let usdValueToMove = 0;
  if (from === "funding") {
    const currentBalance = sourceData.balance || 0;
    const currentUsdValue = sourceData.usdValue || 0;
    usdValueToMove = currentBalance > 0 ? (amount / currentBalance) * currentUsdValue : 0;
  }

  const batch = db.batch();

  // Deduct from source
  if (from === "funding") {
    batch.update(sourceDoc.ref, {
      balance: FieldValue.increment(-amount),
      availableBalance: FieldValue.increment(-amount),
      usdValue: FieldValue.increment(-usdValueToMove)
    });
  } else {
    batch.update(sourceDoc.ref, {
      amount: FieldValue.increment(-amount),
      updatedAt: Timestamp.now().toMillis()
    });
  }

  // Add to destination
  if (!destSnapshot.empty) {
    const destDoc = destSnapshot.docs[0];
    if (to === "funding") {
      batch.update(destDoc.ref, {
        balance: FieldValue.increment(amount),
        availableBalance: FieldValue.increment(amount),
        usdValue: FieldValue.increment(usdValueToMove)
      });
    } else {
      batch.update(destDoc.ref, {
        amount: FieldValue.increment(amount),
        updatedAt: Timestamp.now().toMillis()
      });
    }
  } else {
    // Create destination wallet if it doesn't exist
    const newDestRef = walletsRef.doc();
    if (to === "funding") {
      batch.set(newDestRef, {
        userId: uid,
        type: "funding",
        coin: asset,
        name: sourceData.name || asset, // Fallback name
        balance: amount,
        availableBalance: amount,
        lockedBalance: 0,
        usdValue: usdValueToMove,
        change24h: 0,
      });
    } else {
      batch.set(newDestRef, {
        userId: uid,
        type: "spot",
        coin: asset,
        amount: amount,
        avgBuyPrice: 0,
        updatedAt: Timestamp.now().toMillis(),
      });
    }
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
