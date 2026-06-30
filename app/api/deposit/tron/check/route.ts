import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import { getAdminDb } from "@/lib/firebase-admin";
import { getTronUsdtBalance, getIncomingUsdtTransfers } from "@/lib/deposit/tron";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: Request) {
  try {
    const user = await verifyAuthToken(req);

    const db = getAdminDb();
    const addressRef = db.doc(`users/${user.uid}/deposit_addresses/TRC20`);
    const addressSnap = await addressRef.get();

    if (!addressSnap.exists) {
      return NextResponse.json({ error: "No deposit address found. Please generate one first." }, { status: 404 });
    }

    const data = addressSnap.data()!;
    const address = data.address;
    const processedTxIds: string[] = data.processedTxIds || [];

    if (!address) {
      return NextResponse.json({ error: "Address not found in document." }, { status: 404 });
    }

    // 1. Fetch all incoming USDT transfers from TronGrid
    const transfers = await getIncomingUsdtTransfers(address);
    let newDepositAmount = 0;
    const newTxIds: string[] = [];

    for (const tx of transfers) {
      if (!processedTxIds.includes(tx.txId)) {
        newDepositAmount += tx.amount;
        newTxIds.push(tx.txId);
      }
    }

    // 2. Fetch live on-chain balance for admin display
    const currentOnChainBalance = await getTronUsdtBalance(address);

    // 3. Always update the admin-visible on-chain balance
    await addressRef.update({
      currentBalance: currentOnChainBalance,
      lastCheckedAt: new Date().toISOString(),
    });

    if (newDepositAmount > 0) {
      // 4. Credit user's wallet
      const walletRef = db.doc(`users/${user.uid}/wallet/default`);
      await walletRef.set(
        {
          balances: { USDT: FieldValue.increment(newDepositAmount) },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // 5. Mark transactions as processed and update cumulative processed balance
      await addressRef.update({
        processedTxIds: FieldValue.arrayUnion(...newTxIds),
        processedBalance: FieldValue.increment(newDepositAmount),
        lastDepositAt: new Date().toISOString(),
      });

      // 6. Record each new transaction in the user's history
      const batch = db.batch();
      for (const txId of newTxIds) {
        const txInfo = transfers.find((t: any) => t.txId === txId);
        const txRef = db.collection(`users/${user.uid}/transactions`).doc(txId);
        batch.set(txRef, {
          type: "deposit",
          asset: "USDT",
          amount: txInfo?.amount || 0,
          status: "completed",
          timestamp: new Date().toISOString(),
          chain: "TRC20",
          address: address,
          txId: txId,
        });
      }
      await batch.commit();

      return NextResponse.json({
        newDeposit: true,
        amountAdded: newDepositAmount,
        onChainBalance: currentOnChainBalance,
        newTxCount: newTxIds.length,
      });
    }

    return NextResponse.json({
      newDeposit: false,
      onChainBalance: currentOnChainBalance,
    });
  } catch (error: any) {
    console.error("Error checking TRON balance:", error);
    return NextResponse.json({ error: "Failed to check balance: " + error.message }, { status: 500 });
  }
}
